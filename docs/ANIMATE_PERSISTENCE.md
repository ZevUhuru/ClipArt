# Animate Page — Persistence & Performance

**Date**: 2026-04-04
**Updated**: 2026-04-05

## Problem

Refreshing `/animate` wiped all user state — selected image, prompt text, model
selection, duration, and audio toggle. Users had to start from scratch after any
accidental refresh or navigation away. Additionally, page refreshes exhibited a
noticeable delay and a blank "Loading…" text placeholder.

**Update (Apr 5)**: State was lost on browser close, tab navigation, and new tabs
because `sessionStorage` dies with the tab. Users also couldn't recall previous
animation configurations after clearing or animating. The empty state hid all
controls, underselling the feature to new visitors.

## Solution: Persistent State with Recallable Presets

### URL-synced source image

When a user selects an image via the import modal, the image ID is synced to the
URL query string (`/animate?id=<imageId>`) using `router.replace`. This means:

- The browser's address bar always reflects the current source image.
- Refreshing the page re-fetches the same image from the URL parameter.
- The URL is shareable — pasting it loads the same image context.

### Continuous form state persistence (localStorage)

All form inputs (prompt, model, duration, audio) are persisted to
`localStorage["animate:draft"]` via a debounced `useEffect` (500ms). The draft
is keyed by `sourceId` so stale drafts from a different image are ignored.

**Changed from `sessionStorage` to `localStorage`** so state survives:
- Browser close and reopen
- New tabs
- Navigation to other pages and back

On page load, a single `useMemo` parses the draft once and feeds all `useState`
initializers.

### Saved Presets (Recent Setups)

On successful animate or "Start over" (with a prompt), the current configuration
is saved to `localStorage["animate:presets"]` as a recallable preset:

```typescript
interface AnimatePreset {
  id: string;           // generated ID
  sourceId: string;     // generation ID
  sourceTitle: string;  // for display
  sourceThumb: string;  // image URL for thumbnail
  prompt: string;
  model: string;
  duration: number;
  audio: boolean;
  savedAt: number;
}
```

- Max 10 presets (FIFO eviction)
- Duplicate detection (same source + prompt replaces older entry)
- Individual presets can be deleted from the UI

### Recent Setups UI

A "Recent Setups" section appears in the controls column:

- **Empty state**: expanded by default, showing preset cards with thumbnail,
  prompt, model, duration, and audio info. Clicking loads the preset.
- **Active state** (source loaded): collapsed by default, toggleable. Clicking
  a preset replaces the current form state and navigates to that source.

### Start Over

A "Start over" link appears next to "Change Image" when a source is selected. It:

1. Saves the current config as a preset (if prompt is non-empty).
2. Resets all in-memory state (source, prompt, model, duration, audio, suggestions).
3. Clears `localStorage["animate:draft"]`.
4. Navigates to `/animate` (no query params) via `router.replace`.

### Sign Out Cleanup

When the user signs out (via `onAuthStateChange` in `Providers.tsx`), both
`localStorage["animate:draft"]` and `localStorage["animate:presets"]` are cleared.

### Empty State Controls Preview

When no source image is loaded, the right column now shows the full control
layout (prompt, templates, quality, duration, audio, animate button) in a
disabled/muted state. This communicates the tool's capabilities to new visitors
without requiring an image to be imported first.

## Performance Optimizations

### Singleton Supabase browser client

`createBrowserClient()` in `src/lib/supabase/client.ts` now caches the client
instance in a module-level variable. Every call returns the same object instead of
re-initializing the Supabase SDK, saving ~50-100ms on repeated calls during a
single page lifecycle.

### Deduplicated localStorage reads

A single `useMemo` parses the draft once, and all `useState` initializers
reference the cached object.

### Skeleton loading state

The "Loading image…" text was replaced with a full-page skeleton that mirrors the
actual page layout (image area, controls, duration chips, generate button). Both
the Suspense boundary fallback and the `sourceLoading` state use matching skeletons,
giving users immediate visual feedback and eliminating perceived layout shift.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/supabase/client.ts` | Memoized singleton client |
| `app/(app)/animate/page.tsx` | localStorage persistence, preset save/load/delete, Recent Setups UI, empty-state controls preview |
| `src/components/Providers.tsx` | Clear animate localStorage on sign out |
