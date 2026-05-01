# 01 · Architecture

## Target architecture

```
┌──────────────────────────────────────────────────────┐
│                    clip.art (Next.js)                │
│                                                      │
│  User-facing app: browse, search, download, create   │
│  SEO pages, detail pages, galleries, sharing, sales  │
│                                                      │
│  Owns: UI, routing, auth, credits, SEO, display,     │
│         sharing, marketplace exports, domain data    │
│         (animal_entries, categories, packs)          │
│  Does NOT own: generation, provider calls,           │
│                 image processing, storage            │
│                                                      │
│         ┌──────────────────────────┐                 │
│         │  ESY API call            │                 │
│         │  POST /generate          │                 │
│         │  { subject, style,       │                 │
│         │    content_type, ... }   │                 │
│         └────────────┬─────────────┘                 │
└──────────────────────┼───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                   ESY (app.esy.com)                  │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐   │
│  │  Dashboard  │  │   API        │  │  Workers   │   │
│  │  (control   │  │   (execution │  │  (batch    │   │
│  │   plane)    │  │    plane)    │  │   runners) │   │
│  └─────────────┘  └──────────────┘  └────────────┘   │
│                                                      │
│  Owns: provider routing, retries, quality scoring,   │
│  HITL queues, batch scheduling, cost tracking,       │
│  image processing (sharp/WEBP), storage (R2),        │
│  metadata enrichment (classify), provenance          │
│                                                      │
│         ┌──────────────────────────┐                 │
│         │  AI Providers            │                 │
│         │  - Google Gemini         │                 │
│         │  - OpenAI (gpt-image-*)  │                 │
│         │  - Kling (video)         │                 │
│         │  - Future providers      │                 │
│         └──────────────────────────┘                 │
│                                                      │
│         ┌──────────────────────────┐                 │
│         │  Storage                 │                 │
│         │  - Cloudflare R2         │                 │
│         │  - Supabase (ESY's own)  │                 │
│         └──────────────────────────┘                 │
└──────────────────────────────────────────────────────┘
```

## The two interfaces

### ESY Dashboard (`app.esy.com`) — control plane

Where Zev (and eventually external ops users) spend their daily workflow time:

- Configure and launch batches
- Monitor running jobs (progress, cost, failures)
- Review flagged images in the HITL queue
- Set recurring schedules with budget caps
- View cost reports and generation history

The dashboard is the **primary ESY product**. It's built around clip.art's operational workflow first, then generalized.

### ESY API (`api.esy.com`) — execution plane

What clip.art (and future consumers) call:

- `POST /generate` — request one artifact (user-initiated)
- `POST /batches` — submit a batch job
- `GET /batches/{id}` — poll status
- `GET /generations/{id}` — fetch a completed artifact

Every dashboard action maps to an API call. clip.art's production traffic flows through the same API the dashboard uses.

See [02-api-contract.md](02-api-contract.md) for the full endpoint reference.

## Separation of concerns

| Concern | Owned by |
|---|---|
| User accounts, auth, credits | clip.art |
| UI / routing / SEO / sitemaps | clip.art |
| Categories, animal encyclopedia, packs | clip.art (domain data) |
| `generations` table (for display) | clip.art |
| Social sharing to X, Instagram, Facebook, Pinterest | clip.art |
| Marketplace publishing to Etsy and future stores | clip.art |
| Marketplace OAuth tokens, shop ids, listing ids | clip.art |
| Model selection per style | Migrates to ESY (clip.art currently owns via `site_settings.model_config`) |
| Quality tier selection per style | Migrates to ESY (clip.art owns it today — added today, see tracker) |
| Prompt safety filtering | ESY |
| AI provider API keys | ESY |
| Provider routing / fallback | ESY |
| Retries, rate limit handling | ESY |
| Image processing (WEBP, sharp) | ESY |
| R2 uploads | ESY |
| Classification (title/desc/slug) | ESY |
| Quality scoring + HITL | ESY |
| Batch scheduling | ESY |
| Cost tracking | ESY |
| Provenance (`batch_id`, `run_id`) | ESY |
| Backlinks / attribution on clip.art | clip.art (see [backlinks.md](backlinks.md)) |

Social sharing and marketplace export are downstream distribution concerns. They are documented in [../features/DISTRIBUTION_AND_SHARING.md](../features/DISTRIBUTION_AND_SHARING.md) and should not be implemented in ESY.

## Environment variables

### Before migration (today)

```bash
# Supabase (clip.art's own DB)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# AI Providers (to be removed)
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=
OPENAI_API_KEY=
```

### After migration

```bash
# Supabase (unchanged)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# ESY (new)
ESY_API_URL=https://api.esy.com
ESY_API_KEY=
```

R2 credentials and all AI provider keys are removed from clip.art. ESY holds them.
