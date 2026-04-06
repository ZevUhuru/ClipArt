# Search & Filter UX/UI Overhaul

Redesign the search, filter, and browse UX across clip.art into a world-class, unified
system using progressive disclosure, active filter summaries, animated transitions, and
mobile-optimized patterns — built as a reusable component library that works across every
listing surface.

## Current State Audit

### P0 — Critical UX Problems

1. **Filter overload / no progressive disclosure** — All categories (10+) and styles
   (11-16) are dumped on screen at once. Users are overwhelmed before browsing starts.

2. **No active filter summary or clear-all** — When a category + style is selected the
   only indication is an active pill color buried in the rows. No "Clear all" exists.

3. **No result count** — Zero feedback on filter effectiveness ("is this everything, or
   are there 500 more?").

4. **Inconsistent filter patterns** — Search page uses gray segmented control + black
   category pills + pink style pills. Create page uses a different toggle component.
   StylePicker uses brand-gradient active state with ring + shadow.

5. **Mobile is a wall of wrapped pills** — Category pills wrap to 3-4 rows on small
   screens pushing results far below the fold.

### P1 — Visual & Functionality Gaps

6. **Style chips are text-only** — "Gouache", "Chalk Pastel" mean nothing without
   visual reference.

7. **Content type tabs are flat** — Generic gray buttons with no icons or personality.

8. **Animations tab kills all filters** — Switching to Animations removes category and
   style filters with no replacement.

8b. **My Creations has no search** — 540 lines in `my-art/page.tsx` with only content
    type tabs. No text search, no style filter, no sort, no result count. The API at
    `/api/me/images` only supports a content-type filter param.

### P2 — Discovery Gaps

9. **No sort options** — Cannot sort by newest, popular, or featured on the search page.

10. **Bland empty states** — A dashed border with "No results found" is a dead end.

---

## Architecture

A single composable **FilterBar** component system consumed by all listing pages.

```
src/
├── hooks/
│   └── useFilterState.ts          ← shared filter state, URL sync, fetch
└── components/
    └── filters/
        ├── ContentTypeTabs.tsx     ← pill tabs with icons
        ├── FilterChipRow.tsx       ← progressive disclosure chips
        ├── ActiveFilters.tsx       ← removable applied-filter chips
        ├── SortSelect.tsx          ← sort dropdown
        ├── ResultCount.tsx         ← "42 illustrations"
        └── FilterDrawer.tsx        ← mobile bottom-sheet
```

### Consumer pages

| Page | Path |
|------|------|
| Browse / Search | `app/(app)/search/page.tsx` |
| My Creations | `app/(app)/my-art/page.tsx` |
| Create (clip art) | `app/(app)/create/page.tsx` |
| Create (illustrations) | `app/(app)/create/illustrations/page.tsx` |
| Create (coloring) | `app/(app)/create/coloring-pages/page.tsx` |
| Public animations | `app/animations/page.tsx` |

### Design decisions

- **Progressive disclosure**: top 8 categories visible, "+N more" expands inline;
  top 6 styles with color-dot indicators, expandable to full list.
  Mobile (<640px): top 4 categories + "Filters" button → FilterDrawer.
- **Active filter summary**: between controls and grid; each filter is a removable
  chip; "Clear all" when 2+ active. Animated entrance/exit.
- **Content type tabs**: small SVG icon per tab; active state uses brand gradient;
  framer-motion shared-layout indicator animation.
- **Sort**: small dropdown aligned right — Newest / Popular / Featured (default when
  no query) / Relevance (default when searching).
- **Result count**: contextual string ("Showing 42 watercolor illustrations");
  skeleton while loading. Powered by Supabase `{ count: 'exact' }`.
- **Mobile drawer**: bottom sheet with drag-to-dismiss, sections for each dimension,
  in-drawer category search, "Apply" + "Reset" buttons, filter badge on trigger.

---

## Implementation Phases

### Phase 1 — Foundation

**useFilterState hook** (`src/hooks/useFilterState.ts`)
- Content type, category, style, search query, sort order
- URL sync (read/write searchParams)
- Debounced search (350ms)
- `fetchResults` with offset/pagination
- Result count tracking via API `total` field
- `mode: "public"` → `/api/search` | `mode: "private"` → `/api/me/images`
- Exposes: `filters`, `setFilter`, `clearFilter`, `clearAll`, `results`,
  `isLoading`, `hasMore`, `loadMore`, `totalCount`

**API: `/api/search`**
- Add `{ count: 'exact' }` — return `total` alongside `results`
- Add `sort` param: `newest`, `featured`, `popular`

**API: `/api/me/images`**
- Add `q` param: text search via `ilike` on `prompt` and `title`
- Add `style` param: `.eq("style", style)`
- Add `sort` param: `newest` (default), `oldest`
- Add `{ count: 'exact' }` for `total`
- Animations branch: add `q` via `ilike("prompt", %q%)`

**FilterBar sub-components** (`src/components/filters/`)
- `ContentTypeTabs` — refactored from inline JSX, icons, animation
- `FilterChipRow` — generic: items array, maxVisible, overflow "+N more"
- `ActiveFilters` — removable chips + "Clear all"
- `SortSelect` — controlled select
- `ResultCount` — contextual count + skeleton

### Phase 2 — Search Page Rebuild

Refactor `app/(app)/search/page.tsx` from 477 lines to ~150:
- `useFilterState` for all state
- FilterBar sub-components for all UI
- Keep `SearchImageGrid` + infinite scroll sentinel

Layout:
```
SearchBar (full width, centered)
ContentTypeTabs (icons, animated indicator)
FilterChipRow — categories (top 8, expandable)
FilterChipRow — styles (top 6, color dots, expandable)
ActiveFilters + ResultCount + SortSelect (row, space-between)
──── results grid ────
```

### Phase 3 — Mobile Optimization

**FilterDrawer** (`src/components/filters/FilterDrawer.tsx`)
- framer-motion bottom sheet, drag handle, swipe-to-dismiss
- Sections: Content Type, Categories (with search), Styles (with dots), Sort
- "Apply Filters" primary CTA + "Reset" link
- Badge on trigger showing active filter count

**Responsive breakpoints**
- Desktop (>=768px): inline chip rows with progressive disclosure
- Mobile (<768px): SearchBar + ContentTypeTabs + "Filters (N)" button

### Phase 4 — My Creations Search & Filter

Rebuild `app/(app)/my-art/page.tsx`:
- SearchBar ("Search your creations...")
- ContentTypeTabs (All / Clip Art / Illustrations / Coloring / Animations / Shared)
- FilterChipRow for style (shown for All, Clip Art, Illustrations)
- SortSelect (Newest / Oldest)
- ActiveFilters + ResultCount
- Keep existing animation grid + shared uploads sections

### Phase 5 — Create Pages Unification

- Replace `CreateModeToggle` with `ContentTypeTabs` (`variant="nav"` using Links)
- Adopt `FilterChipRow` in all create pages for style selection

### Phase 6 — Visual Polish

- **Style indicators**: per-StyleKey CSS gradient/pattern dots (16x16)
- **Animated transitions**: crossfade results on content-type switch,
  fade+slide-up on filter change, layout animation on chip expand,
  spring animation on active filter add/remove
- **Enhanced empty states**: contextual message, "remove filters" action,
  suggested alternative categories, optional featured fallback

---

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useFilterState.ts` | NEW — shared filter state hook |
| `src/components/filters/ContentTypeTabs.tsx` | NEW — tabs with icons |
| `src/components/filters/FilterChipRow.tsx` | NEW — progressive disclosure chips |
| `src/components/filters/ActiveFilters.tsx` | NEW — removable active filter chips |
| `src/components/filters/SortSelect.tsx` | NEW — sort dropdown |
| `src/components/filters/ResultCount.tsx` | NEW — contextual result count |
| `src/components/filters/FilterDrawer.tsx` | NEW — mobile bottom sheet |
| `src/data/styleIndicators.ts` | NEW — visual style indicators |
| `app/api/search/route.ts` | Add `total` count + `sort` param |
| `app/api/me/images/route.ts` | Add `q`, `style`, `sort`, `total` |
| `app/(app)/search/page.tsx` | Major refactor to FilterBar system |
| `app/(app)/my-art/page.tsx` | Add search, style, sort, active filters |
| `app/(app)/create/page.tsx` | Adopt shared components |
| `app/(app)/create/illustrations/page.tsx` | Adopt shared components |
| `app/(app)/create/coloring-pages/page.tsx` | Adopt shared components |
| `src/components/CreateModeToggle.tsx` | Wrap ContentTypeTabs |
| `src/components/StylePicker.tsx` | Deprecate → FilterChipRow |

## UX Principles Applied

- Progressive disclosure: 6-8 visible, expand on demand
- Active filter visibility with easy removal
- No zero-result dead ends — suggest alternatives
- Mobile-first filter drawer instead of wrapped pills
- Result count feedback (3x filter engagement)
- Consistent interaction model across all pages
- Meaningful animation (150-300ms, cause-effect)
- Touch targets >= 44px on mobile
- State preservation in URL for sharing + back-button
