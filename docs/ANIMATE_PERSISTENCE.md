# Animate Page — Persistence & Performance

**Date**: 2026-04-04

## Problem

Refreshing `/animate` wiped all user state — selected image, prompt text, model
selection, duration, and audio toggle. Users had to start from scratch after any
accidental refresh or navigation away. Additionally, page refreshes exhibited a
noticeable delay and a blank "Loading…" text placeholder.

## Solution: Session Persistence

### URL-synced source image

When a user selects an image via the import modal, the image ID is synced to the
URL query string (`/animate?id=<imageId>`) using `router.replace`. This means:

- The browser's address bar always reflects the current source image.
- Refreshing the page re-fetches the same image from the URL parameter.
- The URL is shareable — pasting it loads the same image context.

### Continuous form state persistence

All form inputs (prompt, model, duration, audio) are persisted to
`sessionStorage["animate:draft"]` via a debounced `useEffect` (500ms). The draft
is keyed by `sourceId` so stale drafts from a different image are ignored.

On page load, a single `useMemo` parses the draft once and feeds all `useState`
initializers, replacing four independent `sessionStorage` reads with one.

### Start Over

A "Start over" link appears next to "Change Image" when a source is selected. It:

1. Resets all in-memory state (source, prompt, model, duration, audio, suggestions).
2. Clears `sessionStorage["animate:draft"]`.
3. Navigates to `/animate` (no query params) via `router.replace`.

## Performance Optimizations

### Singleton Supabase browser client

`createBrowserClient()` in `src/lib/supabase/client.ts` now caches the client
instance in a module-level variable. Every call returns the same object instead of
re-initializing the Supabase SDK, saving ~50-100ms on repeated calls during a
single page lifecycle.

### Deduplicated sessionStorage reads

Previously, four `useState` initializers each independently called
`sessionStorage.getItem("animate:draft")` and `JSON.parse`. Now a single `useMemo`
parses once, and all initializers reference the cached object.

### Skeleton loading state

The "Loading image…" text was replaced with a full-page skeleton that mirrors the
actual page layout (image area, controls, duration chips, generate button). Both
the Suspense boundary fallback and the `sourceLoading` state use matching skeletons,
giving users immediate visual feedback and eliminating perceived layout shift.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/supabase/client.ts` | Memoized singleton client |
| `app/(app)/animate/page.tsx` | URL sync, continuous persistence, Start Over, skeleton, deduplicated reads |
