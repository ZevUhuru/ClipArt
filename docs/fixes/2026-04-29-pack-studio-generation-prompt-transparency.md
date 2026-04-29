# Fix: Pack Studio Prompt Bloat and Transparency Artifacts

**Date:** 2026-04-29  
**Severity:** High — pack batches could produce inconsistent assets, checkerboard backgrounds, and unclear partial failures

## Problem

Pack Studio batch generation was sending very large final prompts to the image model. A single asset idea could be expanded with:

- Pack title
- Asset title
- Asset idea
- Short pack summary
- Long SEO description
- Audience
- Pack goal
- Tags
- Shared style notes
- Avoid list
- Cohesion instructions
- Transparency/background instructions

This caused three visible issues:

1. **Prompt bloat.** Marketing and SEO copy was being sent to the image model even though that copy belongs on the public pack detail page.
2. **Checkerboard artifacts.** Prompts included words like `transparent` and `transparent background`. Some image models interpret those words visually and draw a fake checkerboard background instead of returning true alpha transparency.
3. **Silent partial failure.** A 5-item batch could return only 1 item without telling the user how many failed or why.

## Root Cause

Pack Studio was trying to keep assets cohesive by injecting too much pack context into every prompt in `app/(app)/create/packs/page.tsx`.

The intent was correct: each image in a bundle is generated separately, so the model needs enough shared context to make the outputs feel like one collection. The mistake was mixing **art direction** with **sales copy**.

Useful context:

- Pack title
- Asset idea
- Compact tags
- Pack goal
- Shared style notes
- Avoid list
- Cohesion instruction

Noisy context:

- Long SEO description
- Buyer persona copy
- Full bundle contents
- Every possible use case
- Words that describe final file processing, like `transparent`

Separately, `app/api/generate/batch/route.ts` did not fully match the single-image generation pipeline in `app/api/generate/route.ts`. The normal generator runs background removal for clip art when the selected model does not return native alpha. Batch generation generated and uploaded images but did not run the same background-removal path.

## Fix

### 1. Sanitize Pack Studio Prompts

Pack Studio now builds compact prompts with a shared helper:

```typescript
buildPackGenerationPrompt({
  packTitle,
  row,
  tags,
  packGoal,
  sharedStyleNotes,
  avoidList,
  keepCohesive,
})
```

The prompt includes only art-relevant context and removes long marketing copy.

The prompt sanitizer strips or replaces transparency/checkerboard wording:

```typescript
function removeTransparencyTerms(value: string): string {
  return value
    .replace(/\btransparent\s+(background|bg)\b/gi, "plain white background")
    .replace(/\bchecker(?:ed|board)\s+(background|pattern)\b/gi, "plain white background")
    .replace(/\btransparent\s+/gi, "")
    .replace(/\btransparency\b/gi, "background removal")
    .replace(/\s{2,}/g, " ")
    .trim();
}
```

The key rule is:

> Send art direction to the model. Let the app pipeline handle transparency.

### 2. Add Final Prompt Inspection

Pack Studio now has an `Inspect final prompts` control in the Generate tab.

This lets the creator see the exact sanitized prompt before spending credits. It is especially useful when debugging batch quality, checking whether a prompt is too broad, or confirming that Pack Studio removed transparency terms.

### 3. Run Background Removal for Batch Clip Art

`app/api/generate/batch/route.ts` now imports and uses:

- `getBgRemovalConfig()` from `src/lib/imageGen.ts`
- `removeBackground()` from `src/lib/bgRemoval.ts`

For clip art batches, when the image model does not return native alpha and background removal is enabled, the route now removes the background before WebP conversion and upload.

The inserted generation row also records:

```typescript
has_transparency: hasTransparency
```

This aligns batch generation with the normal single-image generation path.

### 4. Return Partial Failure Details

The batch route now collects per-image failures:

```typescript
const failures: Array<{
  prompt: string;
  title?: string;
  error: string;
}> = [];
```

The API response includes both:

- `results`
- `failures`

Pack Studio now reports partial success, for example:

```text
Generated 1 item; 4 failed.
```

If every attempt fails, the UI raises a clearer error instead of looking like the batch simply disappeared.

## Result

Pack Studio generation is now easier to understand and safer to use:

- Final prompts are shorter and more focused.
- Marketing/SEO copy stays out of image generation.
- User-written transparency terms are stripped before generation.
- Clip art batch outputs go through the background-removal pipeline.
- The UI exposes partial failures instead of silently hiding them.
- Creators can inspect final prompts before spending credits.

## Remaining Caveat

This fix still runs on the current synchronous batch API. The UI can recover pending state and inspect prompts, but it does not yet have true per-image server-side job status.

The future durable solution is a server-side `pack_generation_jobs` queue, or the ESY equivalent, with per-image statuses, retry/cancel controls, accurate credit accounting, and a durable audit trail.

