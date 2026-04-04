# BUG-005: Category Search Only Shows "Free" Results

**Status**: Resolved
**Severity**: High (most category filters return zero results on search and category pages)
**Affected Pages**: `/search?category=*`, `/[category]`, `/coloring-pages/[theme]`, `/illustrations/[category]`
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. User visits `/search` and clicks any category pill (Flower, Heart, School, etc.)
2. Only "Free" returns results; all other categories show "No results found"
3. Same issue on dedicated category pages (`/flower`, `/cat`, etc.) — empty galleries

## Root Cause

Two compounding issues:

### 1. AI Classifier Defaults to "Free"

The `classifyPrompt()` function in `src/lib/classify.ts` uses an AI model to categorize generated images. When the model can't confidently match a category, or when validation rejects the AI's choice (not in the allowed slug list), it defaults to `"free"`:

```typescript
category: categorySlugs.includes(parsed.category)
  ? parsed.category
  : fallback.category, // "free"
```

In practice, ~92% of clip art items (55/60) were categorized as `"free"`, with only a handful in `"christmas"` or `"tree"`. Categories like `"flower"`, `"cat"`, `"school"`, and `"book"` had zero items despite relevant content existing.

### 2. Strict Exact-Match Category Filter

All category queries used `.eq("category", slug)` — a strict equality filter on the `category` column. When no items have `category = 'flower'`, the query returns zero rows regardless of how many flower-related images exist.

```typescript
// Before: only finds items explicitly categorized as "flower"
query = query.eq("category", category);
```

### Combined Effect

```
User clicks "Flower" → API sends WHERE category = 'flower'
                             → 0 rows (all flower art is in category = 'free')
                             → "No results found"
```

## Fix

Changed category filtering from strict equality to an OR condition that matches:
1. Exact `category` column match (properly classified items)
2. `ILIKE` on `prompt` (items whose generation prompt mentions the category keyword)
3. `ILIKE` on `title` (items whose title mentions the category keyword)

```typescript
// After: finds items by category column OR by keyword in prompt/title
const catPattern = `%${category.replace(/-/g, " ")}%`;
query = query.or(
  `category.eq.${category},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
);
```

The `-` to space replacement handles hyphenated slugs like `"coloring-free"` → `"coloring free"`.

## Files Changed

| File | Change |
|------|--------|
| `app/api/search/route.ts` | Category filter uses OR (exact + prompt + title ILIKE) |
| `app/[category]/page.tsx` | Gallery query uses OR filter |
| `app/coloring-pages/[theme]/page.tsx` | Gallery query uses OR filter |
| `app/illustrations/[category]/page.tsx` | Gallery query uses OR filter |
| `app/[category]/[slug]/page.tsx` | Related images query uses OR filter |
| `app/illustrations/[category]/[slug]/page.tsx` | Related images query uses OR filter |
| `app/coloring-pages/[theme]/[slug]/page.tsx` | Related images query uses OR filter |

## Results After Fix

| Category | Before | After |
|----------|--------|-------|
| Free | 5+ | 5+ |
| Flower | 0 | 5+ |
| Christmas | 2 | 5+ |
| Cat | 0 | 5+ |
| School | 0 | 5+ |
| Book | 0 | 5+ |
| Heart | 0 | 2+ |

## Lessons

1. **Don't rely solely on AI classification for filtering** — AI classifiers have fallback behavior that can silently dump most items into a catch-all category. Query strategies should account for imperfect classification.
2. **Test every filter value, not just the default** — "Free" worked because it was the classifier's fallback, masking the issue for all other categories.
3. **Text-based fallback matching is a practical safety net** — using OR with ILIKE on prompt/title ensures relevant content surfaces even when the category column is wrong.
