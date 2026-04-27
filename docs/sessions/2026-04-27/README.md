# Session — 2026-04-27

## Work completed

### 1. Mobile create page navigation + prompt area redesign

**Files changed:**
- `src/components/CreateMobileHeader.tsx`
- `src/components/CreatePageLayout.tsx`
- `src/components/PromptInput.tsx`
- `src/components/PromptLibrary.tsx`
- `app/(app)/create/page.tsx`
- `src/components/AppBottomNav.tsx`

**Problems fixed:**
- The `/create` mobile top area was too cramped and used desktop-style dropdown chrome.
- The prompt input placeholder wrapped into the controls row on narrow screens.
- Prompt-library category chips wrapped into a dense wall of options.
- The bottom nav still included `Animate`, despite the desired simplified primary nav.

**Key changes:**
- Added an immersive mobile `CreateMobileHeader` with icon-only brand mark, `Create` title, menu sheet, and a contextual content-type rail (`Clip Art`, `Illustrations`, `Coloring`, `Worksheets`, `Packs`).
- Reworked `PromptInput` on mobile so the textarea and controls become a single rounded command card with a clear divider row.
- Moved prompt-library category chips into a horizontal mobile scroller with an edge fade.
- Removed `Animate` from the fixed mobile footer primary nav.

---

### 2. Immersive mobile footer nav

**Files changed:**
- `src/components/AppBottomNav.tsx`
- `src/components/AppMain.tsx`
- `src/styles/globals.css`

**Key changes:**
- Restyled the mobile footer to match the immersive dark studio header language.
- Added subtle pink/orange ambient glow, a glassy rounded rail, and a white active pill.
- Kept the primary nav focused on three high-frequency destinations: `Create`, `Explore`, `My Art`.
- Adjusted the mobile bottom corner offset to match the new footer height.

---

### 3. Explore and Library mobile top regions

**Files changed:**
- `app/(app)/search/page.tsx`
- `app/(app)/library/page.tsx`
- `src/components/AppTopBar.tsx`
- `src/components/SearchBar.tsx`
- `src/components/filters/FilterDrawer.tsx`

**Problems fixed:**
- Shared `AppTopBar` created redundant primary navigation on mobile (`Create`, `Explore`, `My Art`) even though the footer already provided that nav.
- Explore and Library had inconsistent top regions compared with `/create`.
- Visible mobile search/category/style/sort controls consumed too much vertical space and created a "menu menu menu" feel.

**Key changes:**
- Let `/search` and `/library` own their mobile command regions, just like `/create`.
- Explore mobile now renders an immersive `Explore` header with image-type rail (`Clip Art`, `Illustrations`, `Coloring`, `Animations`).
- Library mobile now renders an immersive `Library` header with library-type rail (`All`, `Clip Art`, `Illustrations`, `Coloring`, `Animations`, `Projects`, `Bundles`, `Shared`).
- Removed redundant eyebrow labels (`Browse Explore`, `Saved Library`) so the headers read simply `Explore` and `Library`.
- Moved mobile search, sort, category, and style into the bottom-up `Search & Filters` drawer.
- Kept desktop search/filter controls visible and unchanged during this mobile simplification pass.

---

### 4. Horizontal overflow fix

**Files changed:**
- `src/components/CreateMobileHeader.tsx`
- `src/components/AppTopBar.tsx`
- `app/(app)/search/page.tsx`

**Root cause:**
Decorative glow blobs in the immersive mobile headers were positioned off-canvas
with negative offsets and large blur radii. Without clipping on the header
surface, those visual-only layers could expand `scrollWidth` and push pages
horizontally outside the viewport.

**Fix:**
- Added `overflow-hidden` to the mobile header surfaces that contain glow blobs.
- Added a narrow `overflow-x-hidden` safety guard to the Explore page root.

---

### 5. Desktop command surface facelift

**Files changed:**
- `src/components/CreatePageLayout.tsx`
- `app/(app)/search/page.tsx`
- `app/(app)/library/page.tsx`
- `src/components/AppTopBar.tsx`

**Design direction:**
Desktop already has the dark sidebar for global navigation, so the top content
area should act as contextual page chrome rather than duplicating the global nav.

**Key changes:**
- Removed the tiny duplicated desktop top toolbar from `Create`, `Explore`, and `Library`.
- Added elevated light command surfaces on desktop:
  - `/create`: `Studio / Create` surface with prompt command bar.
  - `/search`: `Discover / Explore` surface with search, image type, category/style filters, and sort.
  - `/library`: `Saved work / Library` surface with search, content tabs, style filter, and sort.
- Kept mobile behavior intact while testing the desktop facelift.

## Commits shipped

- `661e6fc` — Improve mobile create navigation and prompt layout
- `213414e` — Unify mobile app navigation surfaces
- `a46cba2` — Simplify mobile search and filter controls
- `9d3127b` — Refresh desktop command surfaces

