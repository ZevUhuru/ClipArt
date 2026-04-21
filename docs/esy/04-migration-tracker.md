# 04 · Migration Tracker

**Last updated:** 2026-04-21

File-by-file status. This is the document to open when you sit down to do migration work. Update it every time you move a file's status.

**Legend:**
- 🔴 **Pending** — still using direct provider calls
- 🟡 **Partial** — split responsibility or behind a flag
- 🟢 **Migrated** — ESY owns it, clip.art consumes
- ⚫ **Deleted** — removed from clip.art entirely
- 🟣 **Stays** — remains in clip.art permanently (domain data, UI, SEO)

---

## Runtime code

### `src/lib/` — generation primitives

| File | Status | Owner post-migration | Notes |
|---|---|---|---|
| `imageGen.ts` | 🔴 Pending | ESY | Central router; dispatches by `ModelKey`. Quality resolution added today. |
| `gemini.ts` | 🔴 Pending | ESY | Gemini 2.5 Flash Image generation. |
| `gptImage1.ts` | 🔴 Pending | ESY | OpenAI `gpt-image-1`. |
| `gptImage1.5.ts` → `gptImage15.ts` | 🔴 Pending | ESY | **Added today 2026-04-21.** OpenAI `gpt-image-1.5`. Cheaper than 1 at every tier, keeps transparent background. |
| `gptImage2.ts` | 🔴 Pending | ESY | OpenAI `gpt-image-2` / "ChatGPT Images 2.0". No transparent background. |
| `r2.ts` | 🔴 Pending | ESY | R2 upload utilities. |
| `classify.ts` | 🔴 Pending | ESY | Auto-classification pipeline (title/slug/category/description/tags). |
| `promptSafety.ts` | 🔴 Pending | ESY | Prompt safety filter. |
| `styles.ts` | 🟣 Stays (shared) | Shared | `StyleKey` / `ContentType` / `ModelKey` unions. ESY must mirror this exactly. Single source of truth lives here. |
| `imageModelCatalog.ts` | 🟡 Partial (added today) | Split | **Added today.** Pricing + capabilities + batch metadata. Post-migration: keep for admin pricing display, strip runtime-only fields (`params`, `exampleCall`). |
| `seo-jsonld.ts` | 🟣 Stays | clip.art | JSON-LD structured data. |
| `seo.ts` | 🟣 Stays | clip.art | Metadata builders. |

### `app/api/`

| Route | Status | Post-migration | Notes |
|---|---|---|---|
| `app/api/generate/route.ts` | 🔴 Pending | Thin proxy → `POST {ESY}/v1/generate` | Primary migration target — Phase 1. |
| `app/api/animate/route.ts` | 🔴 Pending | Thin proxy → `POST {ESY}/v1/animations` | Phase 4. |
| `app/api/admin/settings/model-config/route.ts` | 🟡 clip.art-owned today | **Delete in Phase 3** | Model routing moves to ESY dashboard. |
| `app/api/admin/settings/model-quality-config/route.ts` | 🟡 **Added today** — clip.art-owned | **Delete in Phase 3** | Quality routing moves to ESY dashboard. |
| All other admin routes | 🟣 Stays | clip.art | Auth, credits, etc. |

### `app/admin/models/`

| File | Status | Post-migration | Notes |
|---|---|---|---|
| `page.tsx` | 🟡 clip.art-owned | Stub that links to ESY dashboard, or delete | Includes today's pricing matrix + Sync/Batch toggle. |
| `[model]/page.tsx` | 🟡 **Added today** | Delete in Phase 3 | Per-model detail page with pricing/capabilities/params. |

### `scripts/`

| Script | Status | Post-migration | Notes |
|---|---|---|---|
| `seed-animal-clipart.ts` | 🔴 Pending | Delete, or thin invoker of `POST {ESY}/v1/batches` | Phase 2. |
| `migrate-gpt-image-1-to-15.ts` | 🟡 **Added today (one-shot)** | Delete after running | Flips `site_settings.model_config` from `gpt-image-1` to `gpt-image-1.5`. Dry-runs show `cartoon` and `watercolor` pending. |
| `audit-openai-spend.ts` | 🟡 **Added today (one-shot)** | Obsolete post-migration | ESY will own cost tracking. |

---

## Database

### Tables that stay in clip.art

- `generations` — display-layer artifact metadata (clip.art inserts rows from ESY responses)
- `animations` — same, for video
- `categories` — clip.art's SEO categories
- `animal_entries` — clip.art's animal encyclopedia domain data
- `profiles` — user accounts
- `packs`, `pack_items` — design bundles
- `site_settings` — includes `model_config`, `model_quality_config` — **gets deprecated** in Phase 3 once ESY owns routing

### New DB migrations shipped today

| File | Purpose | Status |
|---|---|---|
| `db/rename-dalle-to-gpt-image-1.sql` | Rename legacy `dalle` model key to `gpt-image-1` in `site_settings.model_config` and `generations.model` | ✅ Applied |

### Tables that will live in ESY's own DB (not clip.art)

- Batch jobs + runs
- Quality checks + HITL queue
- Variation tracking
- Cost ledger
- Provenance (batch_id, run_id, generated_by)

---

## Today's additions — detail

Everything shipped 2026-04-21 that affects the migration.

### Shipped to prod

1. **Rename `dalle` → `gpt-image-1`** — DB migration + code references updated. The name `dalle` was misleading; the actual model had always been OpenAI `gpt-image-1`.
2. **Added `gpt-image-2` support** — New wrapper `src/lib/gptImage2.ts`, admin-selectable. Pricing surfaced in admin.
3. **Added `gpt-image-1.5` support** — New wrapper `src/lib/gptImage15.ts`, cheaper than `gpt-image-1` at every tier. Recommended default. Admin UI marks `gpt-image-1` as "Legacy — use 1.5".
4. **Quality tier selection per style** — New `site_settings.model_quality_config` row and admin API route. Admin UI now picks low/medium/high per style.
5. **Admin redesign** — `/admin/models` now shows a comprehensive pricing matrix (all qualities × all aspects), Sync/Batch toggle, per-model detail pages, cost-ranked coloring, margin calc.
6. **OpenAI Batch API metadata in catalog** — `src/lib/imageModelCatalog.ts` records 50% batch discount / 24h SLA on each model. Admin UI surfaces it.

### Committed locally, not yet pushed (as of writing)

- `2828cec` — `gpt-image-1.5` integration + migration scripts
- `35f53cf` — OpenAI Batch API metadata + Sync/Batch toggle

### Deferred pending ESY migration (intentional)

These were identified during today's work but NOT implemented in clip.art because generation is migrating to ESY:

| Deferred item | Why | Where it belongs |
|---|---|---|
| **OpenAI Batch API runtime routing** | `gpt-image-1/1.5/2` all support `/v1/images/generations` batch at 50% off, 24h SLA. Wiring this into `src/lib/imageGen.ts` would be a deep refactor of a module being replaced. Catalog metadata is in place. | ESY — phase 2. ESY should opportunistically route batch jobs through provider-native batch endpoints. |
| **Deep refactor of `imageGen.ts`** | Central router for 4 models, growing model/quality dispatch logic, no retries, no fallback. Obvious refactor needed but it's a dead man walking. | ESY — routing layer. |
| **R2 orphan cleanup** | Supabase insert failures leave R2 orphans. Fix is non-trivial and would need coordination with the ESY storage layer. | ESY — atomic store-then-commit semantics. |
| **Retry logic in `app/api/generate/route.ts`** | Same reason. | ESY — transparent retries. |
| **HITL queue for user generations** | No infra today. | ESY — HITL pipeline. |
| **Quality scoring** | No infra today. | ESY — automated quality pipeline. |

### `scripts/migrate-gpt-image-1-to-15.ts` — pending action

Dry-run shows `cartoon` and `watercolor` styles are still routed to `gpt-image-1`. Run `npx tsx scripts/migrate-gpt-image-1-to-15.ts` (no flag) to flip them to `gpt-image-1.5`. Not migration-blocking; this is an optimization while we still own routing.

---

## ESY-side deliverables

This section lives here (in the clip.art repo) as a **consumer's view** of what ESY needs to ship. The authoritative ESY-side tracker should live in `apps/esy/server/api.esy.com/` but everything below reflects what clip.art's integration depends on.

### `api.esy.com` — must ship for Phase 1

- [ ] **Auth** — Bearer token, per-consumer API keys, `client_id` enforcement
- [ ] **`POST /v1/health`** — liveness check
- [ ] **`POST /v1/generate`** — synchronous generation. Must support all 4 models (`gemini`, `gpt-image-1`, `gpt-image-1.5`, `gpt-image-2`), all 3 qualities (`low`, `medium`, `high`), all 3 aspects (`1:1`, `3:4`, `4:3`). Returns `GenerateResponse` shape from [02-api-contract.md](02-api-contract.md).
- [ ] **Prompt safety filter** — replaces `src/lib/promptSafety.ts` logic; runs before provider call
- [ ] **Classification pipeline** — replaces `src/lib/classify.ts`. Outputs `title` (3-8 words, ≤60 chars), `slug` (≤40 chars, collision-checked across clip.art's `generations` table), `description` (150-300 chars, 2-3 sentences), `category`, `tags`.
- [ ] **R2 upload** — replaces `src/lib/r2.ts`. Writes to ESY's own bucket with path structure matching `docs/R2_IMAGE_STORAGE.md` conventions.
- [ ] **WEBP conversion** — sharp pipeline; quality 85, effort 4
- [ ] **Provider routing + retries** — `gemini` via `@google/generative-ai`, `gpt-image-*` via OpenAI SDK. Retry on 429/5xx with exponential backoff.
- [ ] **Idempotency** — `Idempotency-Key` header, 24h dedupe window
- [ ] **Rate limits** — 60/min per `client_id` on `/v1/generate`
- [ ] **Error taxonomy** — return shape from [02-api-contract.md](02-api-contract.md#error-responses): `invalid_request`, `unauthorized`, `quota_exceeded`, `safety_rejected`, `rate_limited`, `provider_failed`, `hitl_required`, `internal_error`

### `api.esy.com` — must ship for Phase 2

- [ ] **`POST /v1/batches`** — batch job submission (50k subjects max per batch)
- [ ] **`GET /v1/batches/{id}`** — status poll
- [ ] **`GET /v1/batches/{id}/results`** — NDJSON stream of completed items, `?since=` support
- [ ] **`POST /v1/batches/{id}/cancel`** — cancel in-flight batch
- [ ] **Batch API routing** — opportunistically route batch jobs through provider-native batch endpoints for 50% cost savings (24h SLA). This is why batch wasn't wired into clip.art's `imageGen.ts` — ESY owns it.
- [ ] **Scheduled batch execution** — cron-driven runs with budget caps, pause-on-failure-rate, checkpoint/resume
- [ ] **Cost tracking** — per-generation cost logging; daily/batch/consumer rollups
- [ ] **Variation tracking** — per-subject matrix of used (pose × style × variation) combos; novel-combo generator for re-runs
- [ ] **Provenance** — every generation tagged with `batch_id`, `run_id`, `created_by`, `client_id`

### `api.esy.com` — must ship for Phase 3

- [ ] **Quality scoring pipeline** — automated checks: `has_white_background`, `is_isolated_object`, `resolution_ok`, `file_size_ok`, `safety_passed`, `matches_prompt`, `quality_score` (0-100)
- [ ] **HITL queue** — staging → review → approve/reject → publish flow. Generations in HITL return 503 `hitl_required` to sync callers; async pollers see them as `needs_review`.
- [ ] **R2 orphan cleanup** — atomic store-then-commit semantics or sweeper for orphans from failed inserts
- [ ] **Dead-letter queue** — failed generations tracked, categorized (rate_limit vs safety vs network vs provider), retryable

### `app.esy.com` — must ship for Phase 3

- [ ] **Model routing UI** — replaces clip.art's `app/admin/models/page.tsx`. Same concept, per-style model + quality config, but in ESY dashboard.
- [ ] **Batch launcher** — replaces `scripts/seed-animal-clipart.ts` invocation. UI to configure + launch batches with safety caps.
- [ ] **Schedule manager** — recurring batch schedules with budget + failure-rate pauses
- [ ] **HITL review UI** — queue of flagged generations with approve/reject actions
- [ ] **Cost reports** — per-run, per-day, per-consumer spend

### Animations (Phase 4)

- [ ] **`POST /v1/animations`** — Kling/fal.ai integration; accepts source `generation_id`, returns video URL + thumbnails
- [ ] **Separate storage tier for video** — MP4s and thumbnails

---

## Blockers on migration

1. **ESY API not deployed yet.** Nothing can be integrated until at minimum `/v1/health` + `/v1/generate` exist in ESY staging.
2. **ESY needs `StyleKey` parity.** Any style added to `src/lib/styles.ts` must be reflected in ESY's routing before Phase 1 cutover.
3. **Transparent background contract.** `gpt-image-2` drops support for transparent backgrounds. ESY needs to either refuse `{ background: "transparent" }` requests on `gpt-image-2` or auto-fallback to `gpt-image-1.5`. Decision not yet made.
4. **Cost visibility parity.** clip.art's admin shows pricing per model/quality/aspect. The ESY dashboard needs equivalent so we don't regress when admin UI is deleted in Phase 3.

---

## Open questions for ESY side

- Does ESY return `image_url` pointing at ESY's R2 bucket or clip.art's? → **Recommendation:** ESY's own bucket, served from `images.clip.art` CDN that CNAMEs to ESY's domain. clip.art never touches R2.
- How does ESY handle idempotency on `POST /generate`? → **Recommendation:** `Idempotency-Key` header, 24h dedupe window per `client_id`.
- What does clip.art do while a generation is in HITL? (Blocking from user's POV.) → **Recommendation:** ESY auto-approves >90% with `quality_score` threshold; only bottom 10% hit HITL. Those fall back to `/batches` (202 Accepted, user sees "pending review").
