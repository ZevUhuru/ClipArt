# Library & Projects

**Date:** April 11, 2026  
**Status:** Phase 1 — Collection folders + Short storyboard MVP  
**Plan reference:** `.cursor/plans/project_management_system_78168cbc.plan.md`

---

## Overview

Library & Projects is the user content management layer of clip.art. It replaces the old "My Creations" page (`/my-art`) with a unified `/library` hub that gives creators a way to organize their assets into collections and build animated short films via a storyboard interface.

The feature is built in phases. Phase 1 ships the core structure: the Library page rename, Collections (simple folders), and the "Short" storyboard MVP with per-shot generation, inline polling, and sequential playback.

---

## What changed in this release

### 1. "My Creations" → "Library"

| Before | After |
|---|---|
| `/my-art` | `/library` |
| Label: "My Creations" | Label: "Library" |
| Sidebar href | Updated + `/storyboard/*` also marks Library as active |

**Redirect strategy:** Two layers:
- `next.config.js` permanent redirect (`/my-art` → `/library`) handles the common case and search engine indexing.
- `app/(app)/my-art/page.tsx` renders a client-side `router.replace("/library")` for any deep links or cached routes that slip through.

### 2. Projects tab in Library

A new "Projects" tab was added to the Library content tabs. It is rendered as a full `<ProjectsView />` component inline in the Library page (bypassing the normal image grid entirely). The tab does **not** use the search bar, style filters, or sort — those only apply to asset tabs.

### 3. New Project modal

Triggered by "New project" button in the Projects tab. Two types:

- **Collection** — a folder of assets (images or animations). Created and shown as a card in the grid. Opens at `/library/projects/[id]` (collection detail — Phase 2).
- **Short** — a storyboard project. Created and immediately redirects the user to `/storyboard/[id]`.

---

## Database

### `public.projects`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users` |
| `name` | text | Required |
| `description` | text | Optional |
| `project_type` | text | `'collection'` or `'short'` |
| `cover_image_url` | text | Optional, set when first item added |
| `item_count` | integer | Maintained in application layer |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

### `public.project_items`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → `projects` |
| `item_type` | text | `'asset'` or `'shot'` |
| `generation_id` | uuid | FK → `generations` (nullable) |
| `animation_id` | uuid | FK → `animations` (nullable) |
| `position` | integer | Sort order, nullable (set on creation) |
| `note` | text | For shots: the motion prompt |
| `added_at` | timestamptz | |

**Constraint logic:**
- `item_type = 'asset'`: exactly one of `generation_id` or `animation_id` must be set.
- `item_type = 'shot'`: `generation_id` (source image) is required; `animation_id` is nullable until the clip is generated.

**RLS:** All policies enforce `user_id = auth.uid()` ownership via a `projects` join.

**Migration file:** `db/add-projects.sql`

---

## API Routes

All routes live under `/api/me/` — the `me` namespace indicates user-scoped resources (requires auth).

### Projects CRUD

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/me/projects` | List all user projects, ordered by `updated_at desc` |
| `POST` | `/api/me/projects` | Create a project. Body: `{ name, project_type?, description? }` |
| `GET` | `/api/me/projects/[id]` | Get project + all items with joined generation/animation data |
| `PATCH` | `/api/me/projects/[id]` | Update name, description, or cover_image_url |
| `DELETE` | `/api/me/projects/[id]` | Delete project and cascade all items |

### Project Items

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/me/projects/[id]/items` | Add an item (asset or shot) |
| `PATCH` | `/api/me/projects/[id]/items/[itemId]` | Update note, animation_id, or position |
| `DELETE` | `/api/me/projects/[id]/items/[itemId]` | Remove item, update item_count |

**`GET /api/me/projects/[id]` response shape:**
```json
{
  "project": { "id": "...", "name": "...", "project_type": "short", ... },
  "items": [
    {
      "id": "...",
      "item_type": "shot",
      "position": 1,
      "note": "Camera slowly zooms in",
      "generation_id": "...",
      "animation_id": "...",
      "generation": { "id", "image_url", "title", "slug", "category", "aspect_ratio", "style" },
      "animation": { "id", "video_url", "thumbnail_url", "preview_url", "status", "prompt", "duration" }
    }
  ]
}
```

---

## Library page (`/library`)

**File:** `app/(app)/library/page.tsx`

Tabs:
- `all` / `clipart` / `illustrations` / `coloring` / `animations` — existing image grid (unchanged logic)
- `projects` — renders `<ProjectsView />` (project card grid + create modal)
- `packs` / `shared` — unchanged

Search bar, style filter, and sort controls are **hidden** when the `projects` tab is active — projects have their own UI.

**Project cards** show:
- Cover image (or placeholder icon by type)
- Type badge: `Short` (purple) or `Collection` (blue)
- Name, item count, last updated date
- Link: Short → `/storyboard/[id]`, Collection → `/library/projects/[id]` (Phase 2)

---

## Storyboard (`/storyboard/[id]`)

**File:** `app/(app)/storyboard/[id]/page.tsx`

### Visual design — vertical film strip

Extends the `AnimationQueue` camera roll metaphor to a full editorial view. The queue is a horizontal preview strip at the bottom of `/animate`; the storyboard is the same film roll turned vertical, with full frames instead of thumbnails.

Each shot card:
```
┌──────────────────────────────────────────┐
│ [FILM STRIP]  │  [PRODUCTION NOTES]       │
│               │                           │
│ ◉  [image]  ◉│  Motion prompt ___________│
│    or [video] │  [Model] [Duration]       │
│ ◉             ◉│  [Generate] / [View clip] │
└──────────────────────────────────────────┘
```

- **Film strip** (`bg-[#1c1c27]`, 120px wide): sprocket holes on both edges (`bg-gray-700/60`, 8×12px, ~20px apart), shot number in `text-white/30 font-mono`, media frame with letterbox effect.
- **Production notes** (`bg-white`): prompt textarea, model/duration toggles, status, action buttons, up/down/delete controls.

Status visual language (matches AnimationQueue):
- Processing: pink ping dot + `from-pink-400 to-purple-400` progress bar on the frame
- Completed: `shadow-[0_0_8px_rgba(52,211,153,0.3)]` emerald glow on the frame
- Failed: `ring-red-500/50` on the frame + red error text

### Shot lifecycle

1. User clicks "Add shot" → `ImagePickerModal` opens (grid of Library images).
2. User selects an image → `POST /api/me/projects/[id]/items` with `item_type: 'shot'`, `generation_id`.
3. User writes a motion prompt in the textarea → saved to `note` on blur via `PATCH`.
4. User selects Model + Duration, clicks "Generate" → `POST /api/animate` called with `sourceUrl`, `prompt`, `model`, `duration`.
5. Response returns `animationId` → polling starts every 4 seconds via `GET /api/animate/status?id=`.
6. On `status === 'completed'` → `PATCH /api/me/projects/[id]/items/[shotId]` sets `animation_id`.
7. Shot card switches to completed state with emerald glow; "View clip" opens a fullscreen video overlay.

### Reordering

Up/Down arrow buttons swap adjacent shots optimistically in local state, then persist both positions via two concurrent `PATCH` calls.

### Play all

"Play all" button visible when ≥ 1 shot has a completed clip. Opens the clip viewer for shot 0 and advances `playingIndex` on `onEnded`. A floating bottom bar shows `Playing shot X of N`.

### Inline name editing

Project name in the top bar is clickable — activates an `<input>` that saves on blur or Enter via `PATCH /api/me/projects/[id]`.

---

## AddToProjectPopover (`src/components/AddToProjectPopover.tsx`)

A lightweight popover that lets users save any image or animation to a Collection. Designed to be wired into `ImageCard` context menus, `ImageDetailDrawer`, and the animate page completion panel.

**Props:**
```typescript
{
  generationId?: string;    // ID of the image to save
  animationId?: string;     // ID of the animation to save
  children?: React.ReactNode; // custom trigger, defaults to folder icon button
  onAdded?: (projectId: string) => void;
}
```

**Behaviour:**
- Opens on click of trigger element; closes on outside click.
- Loads user's collections (project_type === 'collection') from `GET /api/me/projects`.
- Shows a list of collections; clicking one calls `POST /api/me/projects/[id]/items`.
- Already-added collections show a green checkmark.
- "New collection" expands an inline input to create + add in one step.
- Shorts are excluded from the list (shots are managed directly in the storyboard).

---

## Navigation

The sidebar Library item (`src/components/AppSidebar.tsx`) now uses a `matchFn` instead of simple `href` equality:

```typescript
matchFn: (pathname) =>
  pathname === "/library" ||
  pathname.startsWith("/library/") ||
  pathname.startsWith("/storyboard/"),
```

This ensures the Library nav item stays highlighted while the user is inside a storyboard.

---

## Phase roadmap

| Phase | Scope | Status |
|---|---|---|
| **1** | Library rename, Collections, Short storyboard MVP, AddToProjectPopover | ✅ Shipped Apr 11 2026 |
| **2** | Collection detail page (`/library/projects/[id]`), bulk add from Library to collection, cover image auto-set | Pending |
| **3** | Animation export (concat clips via fal.ai ffmpeg-api), timeline scrubber, shot transitions | Pending |
| **4** | Collaboration (share project link, view-only or edit access) | Planned |

---

## Files changed in this release

```
db/add-projects.sql                                  ← new migration
app/(app)/library/page.tsx                           ← new (was my-art)
app/(app)/my-art/page.tsx                            ← replaced with redirect
app/(app)/storyboard/[id]/page.tsx                   ← new storyboard page
app/api/me/projects/route.ts                         ← list + create
app/api/me/projects/[id]/route.ts                    ← get + patch + delete
app/api/me/projects/[id]/items/route.ts              ← add item
app/api/me/projects/[id]/items/[itemId]/route.ts     ← patch + delete item
src/components/AddToProjectPopover.tsx               ← new popover component
src/components/AppSidebar.tsx                        ← /my-art → /library + storyboard matching
next.config.js                                       ← /my-art permanent redirects
docs/features/LIBRARY_AND_PROJECTS.md               ← this file
```

---

## Setup instructions

### Database

Run the migration in your Supabase SQL Editor:

```sql
-- Copy and paste the full contents of db/add-projects.sql
```

Or run via Supabase CLI:

```bash
supabase db push
```

### No env changes required

The feature uses existing Supabase admin client and standard auth patterns. No new environment variables.

---

## Design decisions & trade-offs

**Why `item_count` is maintained in application layer, not a DB view:**  
A `COUNT(*)` subquery on every project list is expensive at scale. Application-layer maintenance is simpler for Phase 1. Phase 2 may replace with a Postgres materialized view.

**Why polling instead of WebSockets for shot generation:**  
The animate page already uses the `useAnimationQueue` Zustand store with polling. Rather than introduce a new real-time channel just for the storyboard, per-shot polling at 4s intervals is equivalent UX for videos that take 30–90s to generate.

**Why `note` column is reused for `shot_prompt`:**  
Avoids adding a new column in Phase 1. Shots store the motion prompt in `note`. If shots need to evolve to support multiple takes or history, a dedicated `shot_prompt` column and `shot_takes` table would be the next step.

**Why Collections and Shorts share the `projects` table:**  
Both are user-owned groups of items with a name and cover. Keeping them in one table reduces query complexity and makes it easy to show "all projects" in a single API call. The `project_type` discriminator is the only structural difference.
