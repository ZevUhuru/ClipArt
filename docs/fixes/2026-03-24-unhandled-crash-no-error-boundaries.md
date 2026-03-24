# Fix: Unhandled Client-Side Crash on /create — No Error Boundaries

**Date:** 2026-03-24
**Severity:** High — user locked out of the app for 20+ minutes with no recovery path

## Problem

A user from Spain signed up via Google OAuth, generated 4 Genshin-style clip art images on `/create`, and on the 5th generation attempt the page crashed to the default Next.js error screen:

> "Error de la aplicación: se ha producido una excepción en el lado del cliente (consulte la consola del navegador para obtener más información)."

Translation: "Application error: a client-side exception has occurred (check the browser console for more information)."

The error persisted on every subsequent visit for ~20 minutes. The user made multiple attempts to get back in (confirmed via Microsoft Clarity session replay) but saw the same dead screen each time. No "try again" button, no navigation, no way out.

## Root Cause

**Primary issue: Zero error boundaries existed in the app.** There were no `global-error.tsx`, `error.tsx`, or route-level error files anywhere under `app/`. Any unhandled JavaScript exception in any component crashed the entire React tree and showed the raw Next.js fallback page — a white screen with a single line of text in the browser's locale.

**Likely trigger:** The crash occurred ~10 seconds after page load (visible in Clarity timeline), which aligns with the async data loading phase — after the initial UI renders but when generation data, credits, or Realtime subscriptions are being set up. The exact JavaScript error is unknown (no browser console access), but several fragile patterns were identified:

1. **`subscribeToCredits` optional chaining gap** — The function accepted `supabase: ReturnType<typeof createBrowserClient>` (which includes `null`). It used `supabase?.channel(...)` with optional chaining, but `.on(...)` was chained directly. If `supabase` were ever null, `undefined.on(...)` would throw a TypeError. While the upstream caller guarded against null, the function signature didn't enforce it, and a try/catch was missing.

2. **`user.email!` non-null assertions** — Both `loadSession` and `onAuthStateChange` used `user.email!` when setting user state. Google OAuth can return undefined emails in edge cases, and the `!` assertion is only a TypeScript hint — it doesn't prevent runtime issues.

3. **No defensive filtering on image grids** — `GenerationGrid`, `HistoryItems`, and `ImageGrid` all called `.map()` directly on data from Supabase and passed `gen.image_url` to Next.js `<Image src={...}>`. A record with a null or empty `image_url` would crash the Image component during render.

## Fix

### 1. Error boundaries at three levels

- **`app/global-error.tsx`** — Last-resort catch-all. Uses inline styles (CSS may not load at this level). Shows a styled error screen with "Try again" and "Go back home" links. Replaces the raw Next.js crash page.

- **`app/error.tsx`** — Catches errors in root-level routes (home page, etc.). Uses the app's Tailwind classes and brand gradient styling.

- **`app/(app)/error.tsx`** — Catches errors within the app shell (`/create`, `/search`, `/my-art`). The sidebar and navigation remain functional since the error boundary sits inside the `(app)` layout, so the user can still navigate away.

### 2. Hardened `subscribeToCredits` in Providers.tsx

- Added explicit `if (!supabase) return` guard at the top
- Removed optional chaining in favor of direct calls (safe after the guard)
- Wrapped the entire channel setup in try/catch so a Realtime connection failure silently fails instead of crashing the React tree

### 3. Replaced non-null assertions on user.email

Changed `user.email!` to `user.email ?? ""` in both `loadSession` and `onAuthStateChange` callbacks.

### 4. Defensive image grid rendering

All three image grids now filter records before rendering:

```typescript
const safeItems = items.filter((gen) => gen.id && gen.image_url);
```

A generation with a missing `id` or `image_url` is silently excluded from the grid instead of crashing the entire page. The `alt` prop also falls back to `"Clip art"` if `prompt`/`title` is empty.

## Impact

- Users who hit a client-side error now see a branded recovery screen with a working "Try again" button
- The sidebar/nav remain functional on app route errors, so users can navigate away
- Realtime subscription failures are silently handled instead of propagating
- One bad generation record can't take down an entire image grid

## Lesson

Every Next.js App Router project needs error boundaries from day one. The default crash page is untranslatable, has no recovery action, and destroys user trust. A `global-error.tsx` and route-level `error.tsx` files are trivial to add and turn a "locked out for 20 minutes" incident into a "tap Try Again and move on" moment.

## Files Changed

- `app/global-error.tsx` — **new**, root-level error boundary with inline styles
- `app/error.tsx` — **new**, root route error boundary
- `app/(app)/error.tsx` — **new**, app shell error boundary
- `src/components/Providers.tsx` — hardened `subscribeToCredits`, replaced `email!` assertions
- `app/(app)/create/page.tsx` — defensive filtering in `GenerationGrid`
- `src/components/HistoryGrid.tsx` — defensive filtering in `HistoryItems`
- `app/(app)/search/page.tsx` — defensive filtering in `ImageGrid`
