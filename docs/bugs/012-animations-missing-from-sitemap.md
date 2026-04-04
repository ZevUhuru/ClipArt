# BUG-012: /animations Page Missing from Sitemap

**Status**: Resolved
**Severity**: Medium (Google may not discover or prioritize the animations hub page)
**Affected Pages**: `/animations`, `/create`, `/search`
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. The `/animations` page was not included in the sitemap at `/sitemap.xml`
2. The `/create` and `/search` hub pages were also missing
3. Google relied on internal links alone to discover these pages, reducing crawl efficiency

## Root Cause

When the animations feature was shipped, the sitemap (`app/sitemap.ts`) was not updated to include the new `/animations` landing page. Similarly, the `/create` and `/search` pages were never added — they were considered "app pages" rather than SEO pages, but they are publicly accessible and should be indexed.

## Fix

Added three new sections to `app/sitemap.ts`:

```typescript
const animationsLanding: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/animations`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  },
];

const hubPages: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/create`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/search`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  },
];
```

Both are included in the final sitemap array.

## Files Changed

| File | Change |
|------|--------|
| `app/sitemap.ts` | Added animations landing page and hub pages (`/create`, `/search`) |

## Lessons

1. **Sitemap updates should be part of the feature launch checklist** — every new public route needs a sitemap entry.
2. **Hub pages are SEO pages too** — even if they're primarily "app" pages, they should be in the sitemap if publicly accessible and valuable for search.
