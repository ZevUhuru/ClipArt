# Generator Landing Pages

**Date:** 2026-04-24
**Status:** IDEA — not started

## Problem

"Clip Art Generator" is a high-intent commercial search term. Our homepage is optimized to rank for it — it has the H1, SEO content, CTAs, and showcase grids aligned with that query.

But "Clip Art Generator" is only one of several generator-shaped terms we should own. Each content type has its own search query, its own audience, and its own conversion intent:

| Search term             | Current clip.art page                 | Status |
|-------------------------|---------------------------------------|--------|
| AI Clip Art Generator   | `/` (homepage)                        | ✅ covered |
| Coloring Page Generator | `/coloring-pages` (gallery hub)       | ⚠️ gallery, not landing |
| Worksheet Generator     | `/worksheets` (gallery hub)           | ⚠️ gallery, not landing |
| Illustration Generator  | `/illustrations` (gallery hub)        | ⚠️ gallery, not landing |
| Animation Generator     | `/animate` (app tool)                 | ❌ not public-landing shaped |
| Sticker Generator       | `/stickers`                           | ❌ not landing-optimized |

The gallery hubs rank okay for "free X" queries (because they show free content), but they don't tell the "AI generator" story. A user searching "coloring page generator" wants to see a hero, a CTA to create, examples of generated output, and a pricing/credits pitch — not a grid of pre-made coloring pages.

## The ask

One dedicated landing page per generator, each optimized for its primary commercial query. The homepage stays as-is (targeting "AI Clip Art Generator"), and each new landing page mirrors its structure for a different content type.

## Candidate URLs

Two possible URL patterns:

**Option A — Flat marketing slugs:**
- `/coloring-page-generator`
- `/worksheet-generator`
- `/illustration-generator`
- `/animation-generator`
- `/sticker-generator`

**Option B — Nested under content type:**
- `/coloring-pages/generator`
- `/worksheets/generator`
- `/illustrations/generator`
- `/animations/generator`

Option A is better for SEO (exact-match slug, cleaner canonical) and doesn't collide with gallery hubs. Option B nests the marketing page under the existing content-type tree, which could be cleaner for sitemap structure but bleeds SEO authority from the gallery root.

Recommend **Option A**.

## Page anatomy (mirror the homepage)

Each landing page should have the same structural components as `/`, just re-themed:

1. **Hero** — H1 matching the search query exactly ("AI Coloring Page Generator"), a 1-2 line value prop, a CTA button to the app's create page for that type.
2. **Inline generator preview** — optional. Could show a prompt input that redirects to `/create/<type>` with the prompt pre-filled.
3. **Showcase grid** — 8–12 featured examples from that content type (e.g. the `/worksheets` top gallery).
4. **"How it works" strip** — 3 steps: prompt → generate → download.
5. **Feature grid** — content-type-specific selling points (e.g., coloring pages: "line art only, print-ready, B&W"; worksheets: "grade-level appropriate, kid-safe characters, printable").
6. **Browse-by-category pills** — links into the existing gallery hub (e.g., grades for worksheets, themes for coloring pages).
7. **FAQ block** — SEO-rich Q&A around the generator term.
8. **Final CTA** — repeat the top CTA.

## SEO requirements

- `<h1>` matches primary search term (no rewording).
- `generateMetadata` using `buildPageMetadata` from `@/lib/seo`.
- Canonical URL set to the flat slug.
- OG image generated from the content type's best showcase image.
- JSON-LD: `WebPage` + `BreadcrumbList` + possibly `SoftwareApplication` for the generator tool itself.
- Added to `app/sitemap.ts` at priority 0.95 (between homepage 1.0 and category hubs 0.9).
- Internal links: homepage and footer link to each generator; each gallery hub links to its corresponding generator landing ("Create your own →").

## Priority ranking

Based on search volume and our existing content depth:

1. **Coloring Page Generator** — highest commercial search volume after clip art, and `/coloring-pages` already has strong content depth to showcase.
2. **Worksheet Generator** — fast-growing query, education-market intent, and we just seeded 100+ examples to showcase.
3. **Illustration Generator** — lower volume but higher-value traffic (designers, marketers).
4. **Animation Generator** — growing but still niche; do after the first three.
5. **Sticker Generator** — do last unless we seed a big sticker catalog first.

## Non-goals

- Don't rebuild the create flows. The landings should deep-link to existing `/create/<type>` pages.
- Don't duplicate SEO content that's already on the gallery hub. Landings are conversion-focused; galleries are browse-focused. Cross-link, don't copy.
- Don't make this a blog or learn surface. No long-form editorial — that's what `/learn` is for.

## Open questions

- Should the landing include an inline generator (live prompt → image) or just a CTA? Inline is higher conversion but more eng work and more surface area to break.
- Should logged-in users skip the landing and go straight to `/create/<type>`? Probably yes — landings are acquisition pages.
- Do we build a generic `<GeneratorLandingPage>` component that takes a content-type config, or author each page bespoke? Generic is faster to roll out and keeps consistency, bespoke allows per-type differentiation. Recommend generic component with per-type content config.

## Related docs

- `docs/features/HOMEPAGE_REDESIGN.md` — the homepage pattern we'd clone.
- `docs/SEO_FRAMEWORK.md` — metadata conventions.
- `docs/features/WORKSHEETS.md` — worksheet-type surfaces already built.
- `docs/features/COLORING_PAGES_SEO.md` — coloring-pages SEO patterns.
