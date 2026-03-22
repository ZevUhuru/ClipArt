# Fix: Duplicate Slug Causes Silent Generation Failure

**Date:** 2026-03-22
**Severity:** High — credits consumed but generation lost

## Problem

When a user regenerated the same prompt in a different style (e.g., "number block 1" in Flat then Sticker), the second generation silently failed. The image was generated, uploaded to R2, and the credit was deducted, but no database row was created. The new image never appeared in the user's recents.

## Root Cause

The `generations` table has a unique partial index on `slug`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_generations_slug
  ON public.generations (slug) WHERE slug IS NOT NULL;
```

The classifier (`src/lib/classify.ts`) generates slugs deterministically from the prompt text. Same prompt = same slug. When the second generation tried to insert with the same slug, the unique constraint caused the Supabase insert to return `null` instead of throwing — a silent failure.

Meanwhile, the R2 storage key already had a random suffix (`${slug}-${random}.webp`), so the file uploaded fine. Only the database insert failed.

## Fix

In `app/api/generate/route.ts`, a single random suffix is now generated once and shared between the R2 key and the database slug:

```typescript
const suffix = Math.random().toString(36).slice(2, 8);
const uniqueSlug = `${classification.slug}-${suffix}`;
const key = `${cat}/${uniqueSlug}.webp`;
// ...
slug: uniqueSlug,  // was: classification.slug
```

This guarantees every generation gets a unique slug (e.g., `number-block-1-x7k2m9`) while keeping it human-readable. The R2 key and the database slug now match exactly (minus the `.webp` extension).

## SEO Concern: Near-Duplicate Detail Pages

With the fix, every generation gets its own unique detail page at `/${category}/${slug}`. When users regenerate the same concept in different styles, this produces multiple pages with:
- **Different images** (Flat vs Sticker vs Cartoon look genuinely different)
- **Near-identical text** (same title, similar description, same prompt)

### Current Risk: Low

At the current scale (hundreds of images), this isn't a concern. Google treats each page as distinct because the visual content differs.

### Future Risk: Medium (at 10K+ pages)

At scale, many pages sharing near-identical titles and descriptions could be flagged as thin/low-value content by Google's helpful content system.

### Safeguards to Implement When Scaling

1. **Include style in title/description.** Have the classifier append the style name: "Number Block 1 — Sticker Style" vs "Number Block 1 — Flat Style." This differentiates the text content naturally. Requires a change to `classifyPrompt()`.

2. **Selective indexing.** Not every generation needs to be a public SEO page. Options:
   - Set `is_public: false` by default; only admin-curated images get public detail pages
   - Add `<meta name="robots" content="noindex">` on generations that share a base slug with an existing page
   - Only index the first generation per base slug

3. **Canonical tags.** Point style variants to the "original" generation as the canonical URL. Google crawls the variants but credits the original. Requires tracking which generation was "first" for a given base slug.

4. **Programmatic quality gate.** Before setting `is_public: true`, check if a similar slug already exists. If so, keep the new one private unless the style is different AND the quality score (future feature) meets a threshold.

### When to Act

- **Now:** No action needed. The random suffix fix prevents data loss.
- **At 5K+ public pages:** Implement safeguard #1 (style in title).
- **At 10K+ public pages:** Implement safeguard #2 (selective indexing).
- **At 50K+ public pages:** Consider safeguard #3 (canonical tags) and #4 (quality gate).
