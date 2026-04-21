# clip.art — Repo Context

Consumer-facing product for browsing, searching, downloading, and generating clip art, coloring pages, illustrations, and animations. For company-level context, see `../CLAUDE.md`.

## Tech Stack

- Next.js (App Router)
- Supabase (Postgres, Auth, RLS)
- Cloudflare R2 (image storage via `https://images.clip.art`)
- Tailwind CSS, Framer Motion
- AI generation: Gemini (image + text), OpenAI (chatgpt-image-latest)

## Relationship to ESY

clip.art delegates all content generation to ESY's API (api.esy.com). ESY handles provider routing, retries, quality scoring, HITL review, batch scheduling, cost tracking, image processing, storage, and metadata enrichment.

**Migration status:** In progress. The current codebase still has direct AI provider calls that will be replaced by ESY API calls:
- `src/lib/imageGen.ts` — Gemini image generation (ESY replaces)
- `src/lib/gptImage1.ts` — OpenAI gpt-image-1 integration (ESY replaces)
- `src/lib/gptImage2.ts` — OpenAI gpt-image-2 / ChatGPT Images 2.0 integration (ESY replaces)
- `src/lib/r2.ts` — R2 upload utilities (ESY replaces)
- `src/lib/classify.ts` — Auto-classification (ESY replaces)
- `src/lib/promptSafety.ts` — Prompt safety filtering (ESY replaces)
- `scripts/seed-animal-clipart.ts` — Batch generation script (ESY replaces)
- `app/api/generate/route.ts` — Will become thin proxy to ESY API

What stays in clip.art: UI, routing, auth, credits, SEO, display, sitemap, domain-specific data (animal_entries, categories).

## Key Documentation

- `docs/CONTENT_GENERATION_WORKFLOWS.md` — Full ESY integration spec with interface definitions
- `docs/esy/` — API contract between clip.art and ESY
- `docs/strategy/sessions/2026-03-21-clip-art-and-esy-strategy.md` — Company strategy session
- `docs/PRODUCT_ARCHITECTURE.md` — clip.art architecture
- `docs/SEO_FRAMEWORK.md` — SEO conventions
- `docs/AUTO_CLASSIFICATION.md` — Classification pipeline docs

## Content Types

| Type | DB content_type | Aspect | R2 path prefix |
|------|----------------|--------|---------------|
| Clip art | clipart | 1:1 | `{category}/` |
| Coloring pages | coloring | 3:4 | `coloring-pages/{theme}/` |
| Illustrations | illustration | 4:3 | `illustrations/{category}/` |
| Animations | N/A | N/A | Separate video storage |

## Database Tables

- `generations` — All generated images (user and batch)
- `animations` — Animated content (video)
- `categories` — SEO categories with metadata
- `animal_entries` — Animal data for encyclopedia pages
- `profiles` — User accounts
- `packs`, `pack_items` — Design bundles
