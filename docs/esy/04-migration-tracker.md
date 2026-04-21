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
