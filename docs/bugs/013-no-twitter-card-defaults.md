# BUG-013: No Twitter Card Defaults in Root Layout

**Status**: Resolved
**Severity**: Low (Twitter/X link previews showed generic text instead of rich cards)
**Affected Pages**: Any page that did not explicitly set its own `twitter` metadata (homepage, some category pages)
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Sharing the homepage or category listing pages on Twitter/X produced plain text previews instead of large image cards
2. The `twitter:card` meta tag was absent from pages that didn't explicitly set it
3. Pages that did set Twitter metadata (detail pages) were unaffected

## Root Cause

The root layout in `app/layout.tsx` had `openGraph` configuration but no `twitter` configuration:

```typescript
export const metadata: Metadata = {
  title: "Clip Art — AI Clip Art Generator",
  description: "...",
  openGraph: { ... },
  // No twitter config — child pages without explicit twitter metadata got nothing
};
```

Next.js does not automatically derive `twitter:card` from Open Graph tags. Without an explicit `twitter` entry in the root metadata, pages that didn't set their own `twitter` config had no Twitter card meta tags at all.

## Fix

Added default Twitter card configuration to the root layout:

```typescript
twitter: {
  card: "summary_large_image",
  site: "@clipart",
},
```

This provides a fallback for all pages. Child pages that export their own `twitter` metadata override these defaults.

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Added `twitter.card` and `twitter.site` to root metadata |

## Lessons

1. **Open Graph and Twitter Cards are separate systems** — setting OG tags does not automatically create Twitter cards. Both need explicit configuration.
2. **Root layout defaults reduce per-page boilerplate** — setting sensible Twitter defaults at the root means most pages inherit them without any additional code.
