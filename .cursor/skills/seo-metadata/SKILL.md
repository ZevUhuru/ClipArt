# SEO Metadata Skill — clip.art

> Use this skill when creating or modifying any public-facing `page.tsx` in the clip.art project.

## When to Use

- Creating a new `page.tsx` under `app/`
- Adding or modifying `generateMetadata` on any page
- Adding JSON-LD structured data to a page
- Fixing SEO issues (missing canonical, bad title, missing OG tags)

## Quick Reference

### Imports

```typescript
// For detail pages (images, articles):
import { buildPageMetadata } from "@/lib/seo";

// For listing/category pages:
import { buildListingMetadata } from "@/lib/seo";

// For JSON-LD structured data:
import { buildImageJsonLd, buildDetailBreadcrumb } from "@/lib/seo-jsonld";
```

### Content Type URL Conventions

| ContentType | Category Path | Detail Path |
|------------|---------------|-------------|
| `clipart` | `/{category}` | `/{category}/{slug}` |
| `coloring` | `/coloring-pages/{theme}` | `/coloring-pages/{theme}/{slug}` |
| `illustration` | `/illustrations/{category}` | `/illustrations/{category}/{slug}` |

### Title Constraints

- Max 60 characters total
- Format: `{Subject} — Free {Category} {ContentLabel} | clip.art`
- `buildTitle()` handles "Free Free" deduplication automatically
- Never hardcode `| clip.art` suffix — the builder adds it

### Description Constraints

- Target range: 100–160 characters
- `buildDescription()` pads short text and truncates long text
- Never hardcode the description suffix — the builder adds it

### Canonical URL

- Every public page MUST have a canonical URL
- Use `buildCanonical(path)` or pass `path` to `buildPageMetadata()`
- Never hardcode `https://clip.art` — use `SITE_URL` constant

### JSON-LD Requirements

Detail pages should include:
1. `ImageObject` — via `buildImageJsonLd()`
2. `BreadcrumbList` — via `buildDetailBreadcrumb()`

Both are rendered in a `<script type="application/ld+json">` tag.

### H1 Requirement

Every public page must render an `<h1>` in server HTML. Do not hide H1 behind client-side state (e.g., `useState` toggling visibility).

## Minimal New Page Template

```typescript
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch data...
  // Return empty if not found:
  // if (!data) return {};

  return buildPageMetadata({
    subject: "Page Title",
    description: "Page description text.",
    contentType: "clipart",         // or "coloring" | "illustration"
    categoryName: "Category Name",
    path: `category/${params.slug}`,
    image: { url: "https://...", alt: "Alt text" },
  });
}

export default async function Page({ params }: PageProps) {
  // Fetch data, notFound() if missing
  return (
    <main>
      <h1>Page Title</h1>
      {/* Page content */}
    </main>
  );
}
```

## Sitemap

After creating a new page, add it to `app/sitemap.ts`. See `docs/SEO_FRAMEWORK.md` for the full sitemap structure.

## Full Documentation

See `docs/SEO_FRAMEWORK.md` for the complete API reference, architecture overview, and adding new content types.
