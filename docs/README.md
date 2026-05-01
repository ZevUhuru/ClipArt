# clip.art Documentation

Internal documentation, plans, patterns, and strategy for the clip.art project.

## ESY Migration

All documentation for clip.art's ongoing migration to ESY's generation infrastructure lives in a dedicated directory:

**→ [`docs/esy/`](esy/README.md)** — start here. Migration tracker, API contract, phased plan, decision log.

## Core Guides

| Document | Description |
|----------|-------------|
| [UX_FLOW.md](UX_FLOW.md) | Complete user experience flow — generation, auth, credits, SEO pages |
| [R2_IMAGE_STORAGE.md](R2_IMAGE_STORAGE.md) | Cloudflare R2 storage plan, directory structure, seeding strategy |
| [ADMIN_CMS.md](ADMIN_CMS.md) | Admin panel — image management, category CRUD, API routes |
| [AUTO_CLASSIFICATION.md](AUTO_CLASSIFICATION.md) | Gemini-powered auto-classification of titles, categories, and SEO metadata |
| [DYNAMIC_CATEGORIES.md](DYNAMIC_CATEGORIES.md) | DB-driven categories replacing hardcoded config, scaling to 100+ |
| [APP_SHELL.md](APP_SHELL.md) | App shell overhaul — white sidebar, `/create` `/search` `/my-art`, cross-linking with SEO pages, URL migration from `/generator` |
| [BRAND_THEME.md](BRAND_THEME.md) | Visual brand theme — image-led public pages, calm app workspaces, colors, typography, layout, and copy rules |

## Features

| Document | Description |
|----------|-------------|
| [Public/Private Toggle](features/PUBLIC_PRIVATE_TOGGLE.md) | User-facing toggle to control whether generations are shared with the community or kept private |
| [Multi-Model Generation](features/MULTI_MODEL.md) | Unified model router (Gemini, GPT Image 1, GPT Image 2) with admin-configurable style-to-model mapping |
| [Bundle-First Strategy](features/BUNDLE_FIRST_STRATEGY.md) | Long-term pack-first content model, 100-pack homepage threshold, character hubs, and asset-to-pack linking |
| [Pack Studio V1](features/PACK_STUDIO_V1.md) | Seller-grade bundle creation workspace — pricing, pack-exclusive assets, generation UX, SEO copy, and publish readiness |
| [Pack Studio Character Reference Sheets](features/PACK_STUDIO_CHARACTER_REFERENCE_SHEETS.md) | First-class character reference sheet workflow using GPT Image 2, preset rows, and reference-board prompt guidance |
| [Pack Release Notifications](features/PACK_RELEASE_NOTIFICATIONS.md) | Admin-controlled and auto-launchable app notifications for newly published pack drops |

## Strategy

| Document | Description |
|----------|-------------|
| [Content Pipeline](strategy/CONTENT_PIPELINE.md) | Agent-driven pipeline for generating 100K-1M keyword-targeted clip art images/year — architecture, cost analysis, Google penalty risk, ramp-up schedule |
| [Character Sheet Clip Art Packs](strategy/CHARACTER_SHEET_PACKS.md) | Strategic direction for premium character sheet bundles as reusable clip art for AI video, storyboards, games, and mascots |
| [Pricing & Model Costs](strategy/PRICING_MODELS.md) | Cost analysis per model, revenue per credit, decision to keep 1 credit for all models |

## Strategy Sessions

| Session | Date | Topics |
|---------|------|--------|
| [Bundle-first packs and Orion launch](sessions/2026-04-30/README.md) | 2026-04-30 | Bundle-first strategy, character hubs, Orion Foxwell, pack release notifications |
| [Clipart-first bundles and character sheets](sessions/2026-04-28/README.md) | 2026-04-28 | MRR targets, credits vs subscriptions, bundle strategy, character sheet packs |
| [clip.art & ESY Strategy](esy/sessions/2026-03-21-strategy.md) | 2026-03-21 | Verticals, $10K-$100K MRR paths, ESY as infrastructure, site architecture |

## Fix Write-ups

| Fix | Date | Impact |
|-----|------|--------|
| [State management & WebP migration](fixes/2026-03-16_state-management-webp-migration.md) | 2026-03-16 | Centralized state, WebP pipeline |
| [Duplicate slug generation failure](fixes/2026-03-22-duplicate-slug-generation-failure.md) | 2026-03-22 | Silent generation loss on repeated prompts, SEO duplicate content concern |
| [Pack Studio prompt bloat and transparency artifacts](fixes/2026-04-29-pack-studio-generation-prompt-transparency.md) | 2026-04-29 | Prompt inspection, transparency-term sanitization, batch background removal, partial failure reporting |

## Structure

| Directory | Purpose |
|-----------|---------|
| `features/` | Feature documentation and specs |
| `ideas/` | Feature ideas and explorations |
| `strategy/` | Product strategy, growth plans, business model |
| `strategy/sessions/` | Strategy session notes (`YYYY-MM-DD-topic.md`) |
| `patterns/` | Code patterns, architecture decisions |
| `fixes/` | Bug fix write-ups and post-mortems |
| `performance-audits/` | Lighthouse audits, CDN setup, optimization notes |
| `archive/` | Superseded or completed plans |

## Naming Conventions

- Root-level docs: `UPPERCASE_WITH_UNDERSCORES.md` for core guides
- Session notes: `YYYY-MM-DD-topic-slug.md`
- Fix write-ups: `YYYY-MM-DD-description.md`
