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

## Structure

| Directory | Purpose |
|-----------|---------|
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
