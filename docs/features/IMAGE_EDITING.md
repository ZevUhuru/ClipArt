# Image Editing with Gemini (Nano Banana 2)

**Shipped:** April 2026

## Overview

AI-powered image editing that lets users modify any generated image via text instructions. Built on Gemini's conversational image editing API (`gemini-2.5-flash-image`), the same model used for generation. Users describe what they want changed ("remove the background", "make it cuter", "add an outline") and the AI applies the edit, producing a new image.

Every edit costs 1 credit (same as generation) and creates a new entry in the user's gallery with a `parent_id` link back to the source image, enabling version chain tracking.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                                │
│                                                          │
│  Drawer/Detail "Edit" btn ──► /edit?id={generation_id}  │
│  Sidebar "Edit" link ───────► /edit (image picker)      │
│  Edit Page ─────────────────► POST /api/edit             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/edit                                          │
│                                                          │
│  1. Validate instruction (length, safety)                │
│  2. Auth + credit check                                  │
│  3. Fetch source image from R2 URL → Buffer              │
│  4. Call Gemini with image + instruction                  │
│  5. Sharp → WebP conversion                              │
│  6. Upload to R2 under edits/{category}/{slug}.webp      │
│  7. Insert generations row (parent_id = source.id)       │
│  8. Deduct 1 credit, return result                       │
└─────────────────────────────────────────────────────────┘
```

## Data Model

Single column addition to the `generations` table:

```sql
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS parent_id uuid
    REFERENCES public.generations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generations_parent_id
  ON public.generations (parent_id) WHERE parent_id IS NOT NULL;
```

- `parent_id = NULL` → original generation (created from scratch)
- `parent_id = {uuid}` → edited from another image

This enables full version chains: original → edit v1 → edit v2 → etc.

**Migration file:** `db/add-edit-support.sql`

## API Endpoint

**`POST /api/edit`** (`app/api/edit/route.ts`)

### Request

```json
{
  "sourceUrl": "https://images.clip.art/animals/cute-cat-abc123.webp",
  "instruction": "Remove the background, make it transparent",
  "isPublic": true
}
```

### Response (success)

```json
{
  "imageUrl": "https://images.clip.art/edits/animals/cute-cat-edit-xyz789.webp",
  "credits": 8,
  "generation": {
    "id": "uuid",
    "image_url": "...",
    "slug": "cute-cat-edit-xyz789",
    "category": "animals",
    "style": "flat",
    "aspect_ratio": "1:1"
  }
}
```

### Error responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ error: "..." }` | Invalid instruction, URL, or safety check failed |
| 401 | `{ requiresAuth: true }` | Not logged in |
| 402 | `{ requiresCredits: true }` | No credits remaining |
| 429 | `{ error: "..." }` | Gemini rate limited |
| 503 | `{ error: "..." }` | Gemini billing not configured |

### Security

- **Auth required** — no anonymous edits (unlike generation which allows one free)
- **Source URL validation** — only `images.clip.art` domain accepted
- **Prompt safety** — same `checkPromptSafety()` filter as generation
- **Instruction length** — max 1000 characters

## Gemini Edit Function

**`src/lib/geminiEdit.ts`**

```typescript
export async function editImage(
  imageBuffer: Buffer,
  mimeType: string,
  instruction: string,
): Promise<Buffer>
```

Uses the `@google/genai` SDK with `responseModalities: ["IMAGE"]`. Passes the source image as `inlineData` alongside the text instruction. Same model env var (`GEMINI_IMAGE_MODEL`) as generation.

## Frontend: Edit Page

**`app/(app)/edit/page.tsx`**

### Layout

Two-column on desktop (image left, controls right), stacked on mobile.

### Entry points

1. **Drawer "Edit" button** → `/edit?id={generation_id}` (pre-loads source)
2. **Detail page "Edit" button** → `/edit?id={generation_id}` (pre-loads source)
3. **Sidebar "Edit" link** → `/edit` (shows image picker from My Creations)

### Features

- **Image picker** — when no `id` param, shows a grid of user's recent creations to choose from
- **Instruction textarea** — 1000 char limit, Cmd+Enter to submit
- **Quick-action presets** — pre-fill the instruction with common edits
- **Progress indicator** — reuses `GenerationProgress` component
- **Before/After toggle** — after edit, switch between original and result
- **Edit Again** — chain edits iteratively (result becomes new source)
- **Download** — same download flow as generation

### Quick-Action Presets

| Label | Instruction |
|-------|------------|
| Remove Background | Remove the background completely, make it transparent, keep only the main subject |
| White Background | Set the background to pure white, keep the main subject unchanged |
| Add Outline | Add a thick bold outline around the main subject |
| Make Coloring Page | Convert this to a black and white coloring book page with thick clean outlines, no color, no shading |
| Make Cuter | Make this illustration cuter and more kawaii-style while keeping the same subject |

These are starting presets — more can be added as simple array entries in the page component.

## Navigation Updates

- **Sidebar** (`AppSidebar.tsx`): Edit item changed from `soon: true` to `soon: false`, now links to `/edit`
- **Drawer** (`ImageDetailDrawer.tsx`): Edit button wired to `/edit?id={image.id}`
- **Detail page** (`ImageDetailPage.tsx`): Edit button wired to `/edit?id={imageId}`, accepts `imageId` prop
- **Route pages**: `[category]/[slug]/page.tsx` and `coloring-pages/[theme]/[slug]/page.tsx` pass `imageId` to `ImageDetailPage`

## Credit Cost

1 credit per edit, same as generation. Rationale:

- Same Gemini API call cost as generation
- Same R2 storage and Sharp processing
- Consistent pricing model for users

## Files

| File | Action |
|------|--------|
| `db/add-edit-support.sql` | New: parent_id column migration |
| `src/lib/geminiEdit.ts` | New: Gemini image editing function |
| `app/api/edit/route.ts` | New: edit API endpoint |
| `app/(app)/edit/page.tsx` | New: edit page with full UI |
| `src/components/AppSidebar.tsx` | Modified: enabled Edit nav link |
| `src/components/ImageDetailDrawer.tsx` | Modified: wired Edit button |
| `src/components/ImageDetailPage.tsx` | Modified: wired Edit button, added imageId prop |
| `app/[category]/[slug]/page.tsx` | Modified: passes imageId to detail page |
| `app/coloring-pages/[theme]/[slug]/page.tsx` | Modified: passes imageId to detail page |

---

## Expansion Roadmap

The following capabilities are planned for future releases, building on the current editing foundation.

### Remove Background (dedicated tool)

Replace Gemini-based background removal with a dedicated pipeline using `sharp` alpha channel manipulation or an ML model like `rembg`. Faster, more reliable, and doesn't consume Gemini API quota. Could be offered as a free or reduced-cost action.

### Upscale

Increase image resolution using Real-ESRGAN or a future Gemini upscaling API. Particularly useful for users who want print-quality output from their clip art. Would require a separate API endpoint and potentially higher credit cost.

### Vectorize (SVG conversion)

Convert raster clip art to SVG using `potrace` or `vtracer`. High demand from designers who need scalable assets. Would produce downloadable `.svg` files alongside the existing WebP/PNG. Could be a premium feature.

### Mask-based Inpainting

When Gemini supports it natively (or via a dedicated model), allow users to paint a mask over a region and describe what should fill it. More precise than text-only instructions for localized edits.

### Multi-turn Editing (chat-style)

Maintain a conversation session with Gemini where each edit builds on the previous context. Instead of sending the image each time, use Gemini's multi-turn conversation API for faster, more coherent sequential edits. Requires session state management.

### Version Comparison UI

A side-by-side or timeline view showing all versions of an image (original → v1 → v2 → ...). Uses the `parent_id` chain to reconstruct history. Could include a slider comparison (before/after) and the ability to revert to any previous version.

### Batch Editing

Apply the same edit instruction to multiple images at once. Useful for consistent style changes across a set (e.g., "add outline to all" or "convert all to coloring pages"). Would use a queue system to avoid rate limiting.

### Style Transfer

Apply the style of one image to another. Uses Gemini's image understanding to extract style characteristics and apply them. Could be implemented as a special edit instruction with a reference image.
