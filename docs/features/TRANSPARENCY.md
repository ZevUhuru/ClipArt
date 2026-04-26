# Transparent Backgrounds for Clip Art

## Why this matters

Clip art's primary use case is compositing — users drop it onto Canva slides, product mockups, t-shirt designs, presentations, and documents. A white background baked into the file makes it unusable for most of those surfaces. Transparent is the correct master format.

This is not cosmetic. Inconsistent or opaque backgrounds are a **conversion blocker**. A user evaluating quality cannot trust the product when the most basic attribute (background) is non-deterministic. A real abandonment event (Clarity session, April 2026) was traced directly to 5/10 images returning opaque white despite a transparent-background prompt.

---

## How it works

### The `has_transparency` DB column

```sql
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS has_transparency boolean NOT NULL DEFAULT false;
```

`has_transparency` is a **write-once fact set at generation time**. It records whether the generation pipeline actually passed `background: "transparent"` to the provider API — not whether the image *looks* transparent, but whether we *guaranteed* it at the API call level.

- `true` = the provider API was called with `background: "transparent"`, and the returned image has a proper alpha channel.
- `false` = the background parameter was `"auto"` or `"opaque"`, and transparency is not guaranteed (may still be transparent by coincidence from prompt, but not assured).

Existing rows default to `false` — they were generated before transparency support was implemented and should be treated as opaque.

### Data flow

```
POST /api/generate
  │
  ├─ imageGen.ts :: generateImage()
  │    ├─ resolveModel() → model key (e.g. "gpt-image-1.5")
  │    ├─ background = (contentType === "clipart" && model supports it) ? "transparent" : "auto"
  │    ├─ hasTransparency = (background === "transparent")
  │    └─ returns { buffer, model, quality, hasTransparency }
  │
  ├─ sharp().webp({ quality: 85 })   ← alpha channel preserved in WebP
  ├─ uploadToR2()                     ← transparent WebP stored
  │
  └─ DB insert: has_transparency = hasTransparency
       └─ generations.select includes has_transparency
            └─ returned in API response as generation.has_transparency
```

### Client-side propagation

```
/api/generate response
  └─ useGenerationQueue: stores hasTransparency on QueuedGeneration
       └─ GenerationQueue.tsx: passes has_transparency to DrawerImage on preview click
            └─ ImageDetailDrawer: shows "Transparent PNG" badge if has_transparency === true

/api/me/images response
  └─ library/page.tsx: reads gen.has_transparency
       └─ passes has_transparency to DrawerImage and drawerList
            └─ ImageDetailDrawer: same badge logic
```

---

## Model support matrix

| Model | `background: "transparent"` | Notes |
|-------|----------------------------|-------|
| `gpt-image-1.5` | ✅ Supported | Confirmed in prod 2026-04-26. Recommended default for clipart. |
| `gpt-image-1` | ⚠️ Param accepted | API accepts the param but output quality not yet validated. Treat as unreliable until tested. |
| `gpt-image-2` | ❌ Not supported | Returns `400: Transparent background is not supported for this model`. Only `"auto"` and `"opaque"` accepted. Use for text-heavy assets (worksheets) where transparency is irrelevant. |
| `gemini` | ❌ No param | Gemini Flash Image has no background parameter. May return transparent images based on prompt, but cannot be guaranteed. `has_transparency` is always `false`. |
| `gemini-pro` | ❌ No param | Same as above. |

### Why gpt-image-1.5 and not gpt-image-2 for clipart

`gpt-image-2` is better at text rendering and complex instruction-following. But it does not support transparent backgrounds — this is a hard API limitation, not a quality issue. For clipart (where the primary deliverable is a compositable asset), `gpt-image-1.5` is strictly the better choice: it supports alpha transparency, is cheaper per image (~19% less at medium quality), and produces comparable output quality for illustration/clipart workloads.

Use `gpt-image-2` when:
- Generating worksheets (text rendering quality matters, transparency is irrelevant)
- Retouching / inpainting tasks that require strong instruction-following

---

## Adding support for a new model

When a new image model is introduced:

1. **Check the provider docs** for `background: "transparent"` support (or equivalent).
2. **Add a wrapper** in `src/lib/{modelName}.ts` with a `background` parameter (follow `gptImage15.ts` as the reference).
3. **Update `imageGen.ts`:**
   - Add the model to `VALID_MODELS`
   - Add a `case` in the `switch` block
   - The `background` variable logic already handles `gpt-image-1.5` → update the condition if the new model also supports transparency:
     ```typescript
     const background = (contentType === "clipart" && (model === "gpt-image-1.5" || model === "new-model"))
       ? "transparent"
       : "auto";
     ```
   - `hasTransparency = background === "transparent"` derives automatically — no other code to change.
4. **Update the model support matrix** in this file.
5. **Add an entry** in `docs/esy/05-decision-log.md` with the confirmation date.

The `has_transparency` flag propagates automatically through the rest of the stack — no changes needed in the generate route, store types, drawer, or library page.

---

## Storage and download format

| Stage | Format | Alpha preserved? |
|-------|--------|-----------------|
| Generation output | Raw PNG buffer from provider | Yes |
| R2 storage | WebP (via `sharp().webp({ quality: 85 })`) | Yes — WebP supports alpha |
| Download | PNG (via `sharp().png()`) | Yes |
| Display | WebP via `<Image>` component | Yes — CSS bg handles preview surface |

`sharp().webp()` and `sharp().png()` both preserve alpha channels by default. The transparency is never lost between generation and download.

---

## Display strategy

**Image cards (grid thumbnails):** Rendered on `bg-gray-50` or `bg-white`. Transparent images look correct; non-transparent images also look correct. No special handling needed.

**Drawer / detail page:** The `ImageDetailDrawer` shows a "Transparent PNG" badge (blue pill) when `image.has_transparency === true`. This is the primary user-facing signal. A background-toggle on the detail page (white / gray / dark / checkered) is a planned enhancement to let users preview the image on different surfaces before downloading.

**Download:** The PNG download preserves the alpha channel. Users who download a `has_transparency` image receive a true transparent PNG, ready for compositing.

---

## Catalog inconsistency (legacy)

Images generated before 2026-04-26 were produced with `has_transparency = false` and likely have white backgrounds. New generations with `gpt-image-1.5` + clipart have `has_transparency = true` and transparent backgrounds. Both coexist in the catalog and library.

This is acceptable. Old images are still usable (white backgrounds work on white surfaces). The inconsistency fades as new content is generated. No backfill is planned unless a batch background-removal job becomes cost-effective.

---

## ESY migration carry-forward

When ESY takes over generation from clip.art:

- ESY's API request contract must accept and forward a `background` parameter for image generation requests.
- For `content_type === "clipart"` requests, ESY should default to `background: "transparent"` when the assigned model supports it. This should be a routing rule in ESY, not a clip.art concern.
- ESY's delivery payload must include `has_transparency: boolean` so clip.art can store it in the `generations` table without needing to re-inspect the image.
- The `has_transparency` column is the long-term source of truth. Once ESY is fully live, the model-checking logic in `imageGen.ts` is gone, but the DB column and the badge remain.

See `docs/esy/05-decision-log.md` (entry: 2026-04-26) for the original decision rationale.
