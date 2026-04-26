# Bug 021 — Detail Page: Dark Frame Extends Beyond Image

**Date:** 2026-04-26
**Status:** Fixed
**Severity:** Medium — visible layout defect on all clip art detail pages
**Affected pages:** `/{category}/{slug}`, `/coloring-pages/{theme}/{slug}`, `/illustrations/{category}/{slug}`
**Component:** `src/components/ImageDetailPage.tsx`

---

## Symptoms

1. **Extra dark strip at the bottom of the frame.** The dark (`#1c1c27`) image
   frame showed visibly more background at the bottom edge than on the other
   three sides, making the padding look asymmetric even though `p-3` applies
   equal padding on all sides.

2. **Illustrations displayed in a square frame.** For `content_type =
   "illustration"` images (which have a 4:3 aspect ratio stored in
   `aspect_ratio`), the frame container always defaulted to `aspect-square`
   because the only explicit check was for `"3:4"`. The 4:3 image was then
   letterboxed with dark bars above and below.

---

## Root Causes

### Cause 1 — `button` inline-block baseline gap

The `<button>` wrapping the image had no explicit `display` set. Browsers
render `<button>` as `inline-block` by default. When an `inline-block` element
sits inside a plain block container, the browser reserves space below it for
text descenders (the portion of letters like `g`, `p`, `y` that hang below the
baseline). This is correct behaviour for inline text flow but wrong when the
button is purely a click target for an image — there is no text, so the extra
descender space appears as dead dark background below the image.

The gap is typically 4–6 px (font-size × line-height × descender ratio). Small
but clearly visible against a dark background.

### Cause 2 — Missing `"4:3"` branch in the aspect-ratio ternary

The aspect-ratio selector read:

```tsx
// Before
image.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"
```

This correctly handles coloring pages (3:4) and clip art (1:1 / null), but
illustrations are stored with `aspect_ratio = "4:3"` and fell through to
`aspect-square`. Inside a square container, `object-contain` letterboxes the
wider-than-tall image, leaving dark background visible above and below.

---

## Fixes

### Fix 1 — Force `block` display on the button

```tsx
// Before
className="group relative w-full cursor-zoom-in overflow-hidden rounded-xl"

// After
className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl"
```

`block` removes the element from inline flow entirely. The browser no longer
allocates descender space and the container tightly wraps its children.

### Fix 2 — Add the `"4:3"` case

```tsx
// Before
image.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"

// After
image.aspect_ratio === "3:4" ? "aspect-[3/4]" :
image.aspect_ratio === "4:3" ? "aspect-[4/3]" :
"aspect-square"
```

### Fix 3 — Flex centering wrapper

Wrapped the dark container in a `flex items-start justify-center` div so the
frame centres within its grid column at all viewport widths, and future
`max-w-*` constraints won't left-align the frame:

```tsx
<div className="flex items-start justify-center">
  <div className="w-full overflow-hidden rounded-2xl bg-[#1c1c27]">
    …
  </div>
</div>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ImageDetailPage.tsx` | Added `block` to button; added `"4:3"` aspect-ratio case; added flex centering wrapper |

---

## Adding a New Content Type — Checklist

When a new content type is introduced (e.g. stickers, worksheets, posters),
check every location that branches on `aspect_ratio`:

### 1. `ImageDetailPage.tsx` — hero frame aspect ratio

```tsx
// src/components/ImageDetailPage.tsx ~line 164
image.aspect_ratio === "3:4" ? "aspect-[3/4]" :
image.aspect_ratio === "4:3" ? "aspect-[4/3]" :
// ADD YOUR CASE HERE, e.g.:
// image.aspect_ratio === "2:3" ? "aspect-[2/3]" :
"aspect-square"   // ← default (1:1)
```

### 2. `ImageDetailPage.tsx` — related images grid

The related images section also branches on `aspect_ratio` for the masonry
layout. Search for `aspectClass` in the file and mirror the same cases.

### 3. `ImageDetailDrawer.tsx`

The drawer used on `/edit`, `/animate`, and the admin panel renders a preview
image. Verify it handles the new aspect ratio, or it will also show dark bars.

### 4. `ImageLightbox.tsx`

The lightbox uses `object-contain` on a viewport-sized container. It handles
any aspect ratio natively because the container itself has no fixed ratio —
but confirm the image is `unoptimized` and `fill` is not constrained by a
fixed aspect wrapper.

### 5. DB `aspect_ratio` values

The canonical stored values are `null` / `"1:1"` (square), `"3:4"` (portrait),
`"4:3"` (landscape). Any new ratio must be documented here and in the content
type table in `CLAUDE.md`. Avoid creative strings (`"16x9"`, `"wide"`) — use
`"W:H"` ratio notation only.

---

## General Rule

**Never assume `aspect_ratio` is only `null` or `"3:4"`.** The field is
user/pipeline-controlled and will grow as new content types ship. Always write
the aspect-ratio selector as an explicit multi-branch expression with a safe
fallback, not a single ternary. A missing branch silently shows dark bars; it
does not throw an error.
