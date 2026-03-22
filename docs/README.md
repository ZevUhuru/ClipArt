# clip.art Documentation

Internal documentation, plans, patterns, and strategy for the clip.art project.

## Core Guides

| Document | Description |
|----------|-------------|
| [UX_FLOW.md](UX_FLOW.md) | Complete user experience flow — generation, auth, credits, SEO pages |
| [R2_IMAGE_STORAGE.md](R2_IMAGE_STORAGE.md) | Cloudflare R2 storage plan, directory structure, seeding strategy |
| [ADMIN_CMS.md](ADMIN_CMS.md) | Admin panel — image management, category CRUD, API routes |
| [AUTO_CLASSIFICATION.md](AUTO_CLASSIFICATION.md) | Gemini-powered auto-classification of titles, categories, and SEO metadata |
| [DYNAMIC_CATEGORIES.md](DYNAMIC_CATEGORIES.md) | DB-driven categories replacing hardcoded config, scaling to 100+ |
| [APP_SHELL.md](APP_SHELL.md) | App shell overhaul — white sidebar, `/create` `/search` `/my-art`, cross-linking with SEO pages, URL migration from `/generator` |

## Features

| Document | Description |
|----------|-------------|
| [Public/Private Toggle](features/PUBLIC_PRIVATE_TOGGLE.md) | User-facing toggle to control whether generations are shared with the community or kept private |

## Strategy

| Document | Description |
|----------|-------------|
| [Content Pipeline](strategy/CONTENT_PIPELINE.md) | Agent-driven pipeline for generating 100K-1M keyword-targeted clip art images/year — architecture, cost analysis, Google penalty risk, ramp-up schedule |

## Strategy Sessions

| Session | Date | Topics |
|---------|------|--------|
| [clip.art & esy.com Strategy](strategy/sessions/2026-03-21-clip-art-and-esy-strategy.md) | 2026-03-21 | Verticals, $10K-$100K MRR paths, esy.com platform, YouTube, site architecture |

## Fix Write-ups

| Fix | Date | Impact |
|-----|------|--------|
| [State management & WebP migration](fixes/2026-03-16_state-management-webp-migration.md) | 2026-03-16 | Centralized state, WebP pipeline |
| [Duplicate slug generation failure](fixes/2026-03-22-duplicate-slug-generation-failure.md) | 2026-03-22 | Silent generation loss on repeated prompts, SEO duplicate content concern |

## Structure

| Directory | Purpose |
|-----------|---------|
| `features/` | Feature documentation and specs |
| `strategy/` | Product strategy, growth plans, business model |
| `strategy/sessions/` | Strategy session notes (`YYYY-MM-DD-topic.md`) |
| `patterns/` | Code patterns, architecture decisions |
| `fixes/` | Bug fix write-ups and post-mortems |
| `performance-audits/` | Lighthouse audits, CDN setup, optimization notes |
| `ideas/` | Feature ideas and explorations |
| `archive/` | Superseded or completed plans |

## Naming Conventions

- Root-level docs: `UPPERCASE_WITH_UNDERSCORES.md` for core guides
- Session notes: `YYYY-MM-DD-topic-slug.md`
- Fix write-ups: `YYYY-MM-DD-description.md`
