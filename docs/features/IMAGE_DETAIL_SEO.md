# Image Detail Page SEO & Quality Overhaul

**Status**: Implemented
**Date**: April 8, 2026

## Problem

Image detail pages (clip art, coloring pages, illustrations) had several quality and SEO issues compared to the animation detail pages:

1. **Titles were raw prompts** — when the AI classifier failed or echoed the prompt back, titles like "Oviraptor close-up portrait, distinctive toothless beak, prominent head crest, e" (truncated at 80 chars) appeared as `<h1>` headings.
2. **No visible prompt section** — the AI prompt was hidden or merged into the title/description, unlike animation pages which have a dedicated "AI Image Prompt" card.
3. **Descriptions echoed the prompt** — when classification failed, `description` was the raw prompt verbatim. No use-case language.
4. **Alt text was unoptimized** — the main image used `alt={image.description}` which could be a 200-char raw prompt.
5. **Slugs were too long** — `slugify()` allowed 80 chars + 6-char random suffix = 87 chars, hurting crawlability.
6. **Illustration CTA used clip art copy** — the bottom CTA only branched on coloring vs everything else.
7. **My Creations drawer showed prompt as title** — the `Generation` interface lacked `title`, so the drawer used the raw prompt as the bold heading.

## Root Cause

The classifier in `src/lib/classify.ts` calls Gemini Flash to generate `{ title, category, description, slug }`. Three failure modes produced bad data:

- **API failures** (timeout, rate limit, empty response): the catch block stored `prompt.slice(0, 80)` as the title
- **JSON parse failures**: same fallback
- **LLM echoing the prompt** as a valid title string: passed validation since it was technically a string, stored without any quality check

## Changes

### 1. Classifier hardening (`src/lib/classify.ts`)

**`cleanTitleFromPrompt(prompt)`** — new helper that produces a presentable title from raw prompt text by de-slugifying, removing punctuation, taking the first 8 words, and title-casing. Used as the fallback instead of `prompt.slice(0, 80)`.

**`looksLikePrompt(title, prompt)`** — post-LLM validation that detects when the model returned a prompt-like title (exact match, truncated match, or comma-heavy long string). When detected, substitutes `cleanTitleFromPrompt()` result.

**Stronger system prompts** — all three classifier branches (clipart, coloring, illustration) now explicitly instruct:
- "Concise 3-8 word name for the main subject"
- "Do NOT repeat the prompt verbatim"
- "Do NOT include commas"
- Description: "suggest use cases (e.g. for school projects, presentations, or crafts)"
- Slug: "max 40 chars, derived from title"

**Shorter slugs** — `slugify()` max reduced from 80 to 50 chars. Combined with the 6-char suffix in generate routes, maximum slug length is now ~57 chars.

### 2. "AI Image Prompt" card (`src/components/ImageDetailPage.tsx`)

Added between the category badge and description, matching the animation detail page design:
- Chat-bubble icon + "AI IMAGE PROMPT" small-caps label
- Prompt in italic with typographic quotes
- Rounded gray card (`rounded-xl border border-gray-100 bg-gray-50/70`)
- Only renders when `image.prompt` exists and differs from `image.title`

### 3. Description deduplication

The description paragraph now only renders when `image.description !== image.prompt`. When classification failed and both are the same raw prompt, the prompt card handles display instead of showing redundant text.

### 4. Alt text optimization

Main image alt changed from `alt={image.description}` (potentially 200-char prompt) to `alt="{title} - Free {categoryLabel}"` — concise, keyword-rich, and always clean.

### 5. Illustration CTA copy

Bottom CTA section now has three branches:
- Coloring: "Create your own X coloring pages" + coloring-specific description
- Illustration: "Create your own X illustrations" + illustration-specific description  
- Clip art: "Create your own X clip art" + generic description

The "Generate similar" button also branches: "Create Similar Illustration" for illustrations.

### 6. My Creations drawer title fix

- Added `title?: string | null` to the `Generation` interface in `src/stores/useAppStore.ts`
- Changed `my-art/page.tsx` drawer mapping from `title: gen.prompt` to `title: gen.title || gen.prompt`
- The drawer component already had separate title/prompt sections — it just wasn't receiving the title data

### 7. Prompt field in route files

All three detail page routes now pass `prompt: dbRow.prompt` to `ImageDetailPage`:
- `app/[category]/[slug]/page.tsx`
- `app/coloring-pages/[theme]/[slug]/page.tsx`
- `app/illustrations/[category]/[slug]/page.tsx`

The `SampleImage` interface in `src/data/sampleGallery.ts` gained an optional `prompt?: string` field.

### 8. Admin reclassify API (`app/api/admin/reclassify/route.ts`)

POST endpoint for bulk re-classification of existing bad titles:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dryRun` | boolean | `true` | Preview bad rows without updating |
| `limit` | number | `50` | Max rows to process (cap: 200) |
| `contentType` | string | all | Filter by content type |

**Detection heuristic** (`titleLooksBad`):
- Title is NULL
- Title matches prompt (normalized)
- Title matches `prompt.slice(0, 80)` (normalized)
- Contains commas and is > 50 chars
- Matches slug-case pattern (e.g. "Word-Word-Word")
- Longer than 70 chars

**Usage:**

```bash
# Preview bad titles
curl -X POST /api/admin/reclassify \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "limit": 20}'

# Fix bad titles
curl -X POST /api/admin/reclassify \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "limit": 50, "contentType": "coloring"}'
```

## Files changed

| File | Changes |
|------|---------|
| `src/lib/classify.ts` | `cleanTitleFromPrompt()`, `looksLikePrompt()`, stronger prompts, shorter slugs |
| `src/components/ImageDetailPage.tsx` | Prompt card, alt text, description dedup, illustration CTA |
| `src/data/sampleGallery.ts` | Added `prompt?` to `SampleImage` interface |
| `src/stores/useAppStore.ts` | Added `title?` to `Generation` interface |
| `app/[category]/[slug]/page.tsx` | Pass `prompt` to image object |
| `app/coloring-pages/[theme]/[slug]/page.tsx` | Pass `prompt` to image object |
| `app/illustrations/[category]/[slug]/page.tsx` | Pass `prompt` to image object |
| `app/(app)/my-art/page.tsx` | Use `gen.title` in drawer mapping |
| `app/api/admin/reclassify/route.ts` | New: bulk re-classification endpoint |

## Structured data (already existed)

`ImageObject` and `BreadcrumbList` JSON-LD were already rendered on every detail page via `buildImageJsonLd()` and `buildDetailBreadcrumb()`. The quality of these schemas improves automatically now that titles and descriptions are no longer raw prompts.
