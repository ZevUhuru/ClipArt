# State Management Overhaul & WebP Migration

**Date**: 2026-03-16

## Issues Fixed

### 1. History Grid Not Updating After Generation

**Problem**: The "Your Generations" list on `/generator` required a full page refresh to show new images after generating.

**Root Cause**: Generations were fetched into local component state (`useState` inside `HistoryGrid`), disconnected from the generation flow. A counter-based hack (`generationVersion`) was added as a workaround to trigger re-fetches, which was wasteful and fragile.

**Fix**: Moved `generations` into the Zustand store as the single source of truth.

- `setGenerations(list)` — called once on initial load
- `prependGeneration(item)` — called by Generator after a successful generation, inserts at index 0
- `/api/generate` now returns the full generation record (`.select().single()`) so the client can insert it directly without a re-fetch
- `HistoryGrid` reads from the store, no local state

### 2. Sign-Out Did Not Reset Generations (Data Leak Bug)

**Problem**: If User A signed in, their generations loaded (`generationsLoaded = true`). User A signed out, User B signed in. Because `generationsLoaded` was still `true`, HistoryGrid skipped fetching, and User B saw User A's history.

**Root Cause**: Sign-out only reset `user` and `credits` but not `generations` or `generationsLoaded`. The sign-out logic was also duplicated across `Nav`, `CategoryNav`, and `Providers` — each with the same incomplete reset.

**Fix**: Added `resetUserState()` to the Zustand store:

```typescript
resetUserState: () =>
  set({ user: null, credits: 0, generations: [], generationsLoaded: false }),
```

All three sign-out paths (`Nav`, `CategoryNav`, `Providers.onAuthStateChange`) now call `resetUserState()` instead of manually setting individual fields.

### 3. History Grid Cards Not Linking to Detail Pages

**Problem**: Generated images on `/generator` could only be downloaded — clicking them did nothing. No way to navigate to the SEO detail page.

**Fix**: Cards now link to `/{category}/{slug}` (or `/{category}/{id}` fallback). Added a "View" link alongside "Download" and a hover scale effect on the image.

### 4. All Generated Images Stored as PNG (~1MB each)

**Problem**: Gemini returns PNG. All 46 previously generated images were stored as PNG in R2 and served as PNG to browsers. Average file size ~1MB per image.

**Fix**:
- **New generations**: `app/api/generate/route.ts` now converts PNG → WebP (quality 85, effort 4) via Sharp before uploading to R2
- **Existing images**: Ran `scripts/migrate-png-to-webp.mjs` to convert all 46 PNG objects in R2 to WebP, update DB URLs, and delete old PNGs
- **Downloads**: `/api/download` converts WebP back to PNG on the fly so users always receive `.png` files

**Results**: 93-97% size reduction per image. Total R2 storage dropped from ~47MB to ~2.6MB.

## Files Changed

| File | Change |
|------|--------|
| `src/stores/useAppStore.ts` | Added `Generation` interface, `generations`, `generationsLoaded`, `prependGeneration()`, `resetUserState()` |
| `src/components/Generator.tsx` | Calls `prependGeneration()` after successful generation |
| `src/components/HistoryGrid.tsx` | Reads from store instead of local state, added detail page links |
| `src/components/Nav.tsx` | Uses `resetUserState()` instead of manual field resets |
| `src/components/CategoryNav.tsx` | Uses `resetUserState()` instead of manual field resets |
| `src/components/Providers.tsx` | Uses `resetUserState()` on auth state change sign-out |
| `app/api/generate/route.ts` | Sharp WebP conversion, returns full generation record |
| `app/api/download/route.ts` | WebP → PNG conversion for user downloads |
| `scripts/migrate-png-to-webp.mjs` | One-time migration script (46 images, 0 failures) |
