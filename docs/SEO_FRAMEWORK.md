# SEO Framework — clip.art

> Centralized metadata, structured data, and canonical URL system for all public-facing pages.

## Overview

The clip.art SEO framework standardizes how metadata, Open Graph tags, Twitter cards, canonical URLs, and JSON-LD structured data are generated across every content type. Rather than each page manually building its own `<title>`, `<meta>`, and JSON-LD blocks, all pages use a shared utility layer that enforces best practices automatically.

### Goals

1. **Consistency** — Every page gets a canonical URL, OG tags, Twitter card, and JSON-LD without manual effort.
2. **No duplicate content** — Canonical URLs are present on every page, eliminating index duplication.
3. **Title safety** — The "Free Free" bug (when category is "Free") is handled centrally.
4. **Description quality** — Short descriptions get contextual padding; long ones get smart truncation.
5. **Structured data** — BreadcrumbList and ImageObject JSON-LD are generated correctly for all content types, including illustrations.
6. **Future-proofing** — Adding a new content type only requires adding an entry to the content type maps in `seo.ts`.

---

## Architecture

```
src/lib/seo.ts          ← Metadata builders (titles, descriptions, canonicals, full Metadata objects)
src/lib/seo-jsonld.ts   ← JSON-LD builders (ImageObject, BreadcrumbList, VideoObject)
app/layout.tsx           ← Root defaults (metadataBase, title template, Twitter config)
app/**/page.tsx          ← Each page calls buildPageMetadata() or buildListingMetadata()
```

### Data flow

```
Page (generateMetadata)
  → buildPageMetadata({ subject, description, contentType, categoryName, path, image })
    → buildTitle()     — truncates to 60 chars, handles "Free Free"
    → buildDescription() — pads short text, truncates long text to 160 chars
    → buildCanonical() — normalizes path → full URL
    → returns Metadata  — title, description, canonical, OG, Twitter
```

---

## API Reference

### `seo.ts` — Metadata utilities

#### Constants

| Export | Value | Purpose |
|--------|-------|---------|
| `SITE_URL` | `"https://clip.art"` | Base URL for all canonical/OG URLs |
| `SITE_NAME` | `"clip.art"` | Used in OG `siteName` and JSON-LD `author` |

#### Types

```typescript
type ContentType = "clipart" | "coloring" | "illustration";
```

#### `buildTitle(subject, opts?)`

Builds a safe `<title>` tag under 60 characters.

```typescript
buildTitle("Cute Cat", { categoryName: "Animals", contentType: "clipart" })
// → "Cute Cat — Free Animals Clip Art | clip.art"

buildTitle("Dinosaur", { categoryName: "Free", contentType: "coloring" })
// → "Dinosaur — Free Coloring Page | clip.art" (no "Free Free")
```

**Parameters:**
- `subject` — The image/page title
- `opts.categoryName` — Category name (optional)
- `opts.contentType` — `"clipart"` | `"coloring"` | `"illustration"` (default: `"clipart"`)

#### `buildDescription(rawText, contentType?)`

Generates a meta description in the 100–160 character sweet spot.

- Short text (<100 chars) → appends CTA suffix
- In-range text (100–160 chars) → used as-is
- Long text (>160 chars) → truncated at sentence/comma boundary

#### `buildCanonical(path)`

Converts a relative path to a full canonical URL.

```typescript
buildCanonical("animals/cute-cat")
// → "https://clip.art/animals/cute-cat"
```

#### `contentTypePath(contentType, category, slug)`

Returns the URL path for a content detail page.

```typescript
contentTypePath("illustration", "fantasy", "dragon-castle")
// → "illustrations/fantasy/dragon-castle"
```

#### `categoryPath(contentType, categorySlug)`

Returns the URL path for a category listing page.

```typescript
categoryPath("coloring", "animals")
// → "coloring-pages/animals"
```

#### `buildPageMetadata(opts)` — Detail pages

Returns a complete `Metadata` object with title, description, canonical, OG, and Twitter.

```typescript
buildPageMetadata({
  subject: "Cute Cat Sitting",
  description: "A cute cartoon cat sitting on a pillow.",
  contentType: "clipart",
  categoryName: "Animals",
  path: "animals/cute-cat-sitting",
  image: { url: "https://cdn.clip.art/...", alt: "Cute cat" },
})
```

#### `buildListingMetadata(opts)` — Category/theme listing pages

Returns a `Metadata` object for listing pages with appropriate defaults.

```typescript
buildListingMetadata({
  title: null,  // Falls back to generated title
  description: null,  // Falls back to generated description
  categoryName: "Animals",
  contentType: "clipart",
  path: "animals",
})
```

---

### `seo-jsonld.ts` — Structured data

#### `buildImageJsonLd(opts)`

Returns an `ImageObject` schema for image detail pages.

```typescript
buildImageJsonLd({
  title: "Cute Cat",
  description: "A cute cartoon cat",
  imageUrl: "https://cdn.clip.art/...",
  tags: ["cat", "animals", "flat"],
})
```

#### `buildDetailBreadcrumb(opts)`

Returns a `BreadcrumbList` schema with content-type-aware paths.

```typescript
buildDetailBreadcrumb({
  contentType: "illustration",
  categorySlug: "fantasy",
  categoryName: "Fantasy",
  imageTitle: "Dragon Castle",
  imageSlug: "dragon-castle",
})
// → Home > Illustrations > Fantasy Illustrations > Dragon Castle
```

#### `buildVideoJsonLd(opts)`

Returns a `VideoObject` schema for learn/video pages. Only includes optional fields (`thumbnailUrl`, `duration`, `contentUrl`) when present.

---

## URL Conventions

| Content Type | Category Listing | Detail Page |
|-------------|------------------|-------------|
| Clip Art | `/{category}` | `/{category}/{slug}` |
| Coloring Pages | `/coloring-pages/{theme}` | `/coloring-pages/{theme}/{slug}` |
| Illustrations | `/illustrations/{category}` | `/illustrations/{category}/{slug}` |
| Animations | `/animations` | n/a (no individual pages yet) |
| Learn | `/learn` | `/learn/{slug}` |

---

## Root Layout Defaults (`app/layout.tsx`)

The root layout provides these defaults that child pages inherit:

| Property | Value |
|----------|-------|
| `metadataBase` | `new URL("https://clip.art")` |
| `title.template` | `"%s \| clip.art"` |
| `title.default` | `"Clip Art — AI Clip Art Generator"` |
| `twitter.card` | `"summary_large_image"` |
| `alternates.canonical` | `"https://clip.art"` |

Child pages that export their own `generateMetadata` override these defaults.

---

## Checklist for New Pages

When creating a new public-facing `page.tsx`:

- [ ] Import `buildPageMetadata` or `buildListingMetadata` from `@/lib/seo`
- [ ] Export a `generateMetadata` function that calls the builder
- [ ] Include `path` to generate the canonical URL
- [ ] For detail pages: pass `image` for OG/Twitter image tags
- [ ] For detail pages: render JSON-LD using `buildImageJsonLd` + `buildDetailBreadcrumb`
- [ ] Ensure an `<h1>` renders in the server-side HTML (not behind client state)
- [ ] Add the page to `app/sitemap.ts`

---

## Sitemap Coverage

The sitemap (`app/sitemap.ts`) includes:

- Homepage
- All clip art categories + detail pages
- Sample gallery images
- Coloring pages landing + themes + detail pages
- Illustrations landing + categories + detail pages
- Animations landing
- Stickers landing
- Hub pages (`/create`, `/search`)
- Learn hub + article pages

---

## Bugs Fixed in This Overhaul

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| "Free Free Clip Art" in titles | Category name "Free" + "Free {category}" template | `buildTitle()` detects `categoryName === "Free"` and omits duplication |
| Missing canonical URLs on clip art pages | No `alternates.canonical` exported | All pages now use builders that include canonical |
| Illustration breadcrumbs showing clip art paths | `ImageDetailPage` JSON-LD hardcoded for clip art/coloring only | Refactored to use `buildDetailBreadcrumb()` with `contentType` |
| `/coloring-pages/free` 404 | Breadcrumb links to `/coloring-pages/free` but no theme exists | `ImageDetailPage` maps `category: "free"` → `/coloring-pages` |
| VideoObject missing required fields | `description` and `thumbnailUrl` could be undefined | Learn page now conditionally includes fields, ensures `description` fallback |
| `/animations` not in sitemap | Missing from sitemap generation | Added animations landing + hub pages |
| No Twitter card defaults | Root layout missing `twitter` config | Added `twitter.card` and `twitter.site` to root metadata |

---

## Adding a New Content Type

1. Add the type to `ContentType` union in `src/lib/seo.ts`
2. Add entries to `CONTENT_TYPE_LABELS` and `CONTENT_TYPE_LABELS_PLURAL`
3. Add a `case` to `contentTypePath()` and `categoryPath()`
4. Add breadcrumb handling in `buildDetailBreadcrumb()` in `seo-jsonld.ts`
5. Create pages using `buildPageMetadata()` / `buildListingMetadata()`
6. Add routes to `app/sitemap.ts`
