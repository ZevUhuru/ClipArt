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
// → "Cute Cat — Free Animals Clip Art"
// Final <title> after layout template: "Cute Cat — Free Animals Clip Art | clip.art"

buildTitle("Dinosaur", { categoryName: "Free", contentType: "coloring" })
// → "Dinosaur — Free Coloring Page" (no "Free Free")
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

## Indexing Control System

### How it works

Indexing is controlled through a **layered metadata inheritance** system in Next.js:

```
app/layout.tsx                    ← Root: title template "%s | clip.art", default metadata
  app/(app)/layout.tsx            ← App shell: robots { index: false } by default
    app/(app)/create/layout.tsx   ← Override: robots { index: true } + unique metadata
    app/(app)/search/layout.tsx   ← Override: robots { index: true } + unique metadata
    app/(app)/templates/layout.tsx ← Override: robots { index: true } + unique metadata
  app/[category]/[slug]/page.tsx  ← Public: inherits root (indexed), uses buildPageMetadata()
  app/coloring-pages/*            ← Public: inherits root (indexed)
  app/illustrations/*             ← Public: inherits root (indexed)
```

**The rule:** Pages inside `(app)/` are noindexed by default because they're behind the authenticated app shell. To make a specific `(app)` page indexable, create a `layout.tsx` in that route folder that overrides `robots` back to `{ index: true, follow: true }` and provides unique metadata.

### Current indexing status

| Route | Indexed? | How |
|-------|----------|-----|
| `/` | Yes | Root layout default |
| `/[category]` | Yes | `generateMetadata()` in page |
| `/[category]/[slug]` | Yes | `buildPageMetadata()` via `generateMetadata()` |
| `/coloring-pages/**` | Yes | Pages export own metadata |
| `/illustrations/**` | Yes | Pages export own metadata |
| `/animations` | Yes | Page exports own metadata |
| `/stickers` | Yes | Page exports own metadata |
| `/learn`, `/learn/[slug]` | Yes | Pages export own metadata |
| `/create` | Yes | **Override layout** in `(app)/create/layout.tsx` |
| `/create/coloring-pages` | Yes | **Override layout** in `(app)/create/coloring-pages/layout.tsx` |
| `/create/illustrations` | Yes | **Override layout** in `(app)/create/illustrations/layout.tsx` |
| `/search` | Yes | **Override layout** in `(app)/search/layout.tsx` |
| `/templates` | Yes | **Override layout** in `(app)/templates/layout.tsx` |
| `/edit` | No | Inherits `(app)` noindex — tool page, needs image ID |
| `/animate` | No | Inherits `(app)` noindex — tool page, needs image ID |
| `/my-art` | No | Inherits `(app)` noindex — user-specific content |
| `/generator` | N/A | 301 redirects to `/create` |

### Making an (app) page indexable

1. Create a `layout.tsx` in the route's folder
2. Export metadata with `robots: { index: true, follow: true }`
3. Include a unique `title` (without `| clip.art` — the root template adds it)
4. Include a `description` and `alternates.canonical`

```typescript
// app/(app)/your-page/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Unique Page Title",
  description: "A unique description under 160 characters.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/your-page",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Title tag rules

- **Never** add `| clip.art` to title strings — the root layout's `template: "%s | clip.art"` handles this for all pages automatically.
- The `buildTitle()` function in `seo.ts` also omits the suffix — it relies on the template.
- Hardcoding the suffix causes double suffixes: `"My Title | clip.art | clip.art"`.
- OpenGraph and Twitter titles can include the suffix if you want it in social previews, but the `<title>` tag must not.

### Duplicate content prevention

All detail pages (clipart, coloring, illustrations) enforce a single canonical URL using **301 permanent redirects**:

1. **ID → slug redirect:** If a page is accessed via `/animals/abc123-uuid` but the image has a slug `cute-dog`, it redirects to `/animals/cute-dog`.
2. **Category mismatch redirect:** If a page is accessed via `/food/cute-dog` but the image's real category is `animals`, it redirects to `/animals/cute-dog`.
3. **Canonical URL:** The `buildPageMetadata()` canonical always uses the image's true category and slug from the database, not the URL params.
4. **Trailing slashes:** `next.config.js` has `trailingSlash: false`. Next.js automatically 308 redirects `/path/` to `/path`.

---

## Checklist for New Pages

When creating a new public-facing `page.tsx`:

- [ ] Import `buildPageMetadata` or `buildListingMetadata` from `@/lib/seo`
- [ ] Export a `generateMetadata` function that calls the builder
- [ ] Include `path` to generate the canonical URL
- [ ] **Do not** add `| clip.art` to any title string
- [ ] For `(app)/` pages: create a `layout.tsx` with `robots: { index: true }` and unique metadata
- [ ] For detail pages: pass `image` for OG/Twitter image tags
- [ ] For detail pages: render JSON-LD using `buildImageJsonLd` + `buildDetailBreadcrumb`
- [ ] For detail pages: add redirect logic for ID-to-slug and category mismatches
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

## Bugs Fixed

### Original overhaul

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| "Free Free Clip Art" in titles | Category name "Free" + "Free {category}" template | `buildTitle()` detects `categoryName === "Free"` and omits duplication |
| Missing canonical URLs on clip art pages | No `alternates.canonical` exported | All pages now use builders that include canonical |
| Illustration breadcrumbs showing clip art paths | `ImageDetailPage` JSON-LD hardcoded for clip art/coloring only | Refactored to use `buildDetailBreadcrumb()` with `contentType` |
| `/coloring-pages/free` 404 | Breadcrumb links to `/coloring-pages/free` but no theme exists | `ImageDetailPage` maps `category: "free"` → `/coloring-pages` |
| VideoObject missing required fields | `description` and `thumbnailUrl` could be undefined | Learn page now conditionally includes fields, ensures `description` fallback |
| `/animations` not in sitemap | Missing from sitemap generation | Added animations landing + hub pages |
| No Twitter card defaults | Root layout missing `twitter` config | Added `twitter.card` and `twitter.site` to root metadata |

### April 2026 — Score recovery (99 → 43 → fix)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Double `\| clip.art` in all title tags | `buildTitle()` appended suffix AND root layout `template` added it again | Removed suffix from `buildTitle()` — layout template is the single source |
| Hardcoded `\| clip.art` in 6 page files | Static metadata strings included suffix manually | Removed suffix from animations, illustrations, coloring-pages, stickers, learn pages |
| Duplicate titles on app pages | `/create`, `/edit`, `/animate`, etc. had no metadata, all showed homepage title | Added `noindex` default to `(app)` layout + override layouts with unique metadata for indexable pages |
| Same image accessible at multiple URLs | `/animals/cute-dog` and `/food/cute-dog` both rendered, different canonicals | 301 redirect to canonical category URL on all detail pages |
| ID and slug URLs both rendered | `/animals/abc123` and `/animals/cute-dog` served same content | 301 redirect from ID URL to slug URL on all detail pages |
| Trailing slash duplicates | `/animals/cute-dog/` and `/animals/cute-dog` both resolved | Added `trailingSlash: false` to `next.config.js` |

---

## Adding a New Content Type

1. Add the type to `ContentType` union in `src/lib/seo.ts`
2. Add entries to `CONTENT_TYPE_LABELS` and `CONTENT_TYPE_LABELS_PLURAL`
3. Add a `case` to `contentTypePath()` and `categoryPath()`
4. Add breadcrumb handling in `buildDetailBreadcrumb()` in `seo-jsonld.ts`
5. Create pages using `buildPageMetadata()` / `buildListingMetadata()`
6. Add routes to `app/sitemap.ts`
