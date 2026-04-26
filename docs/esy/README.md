# ESY Migration — clip.art

Single source of truth for migrating clip.art's generation pipeline to [api.esy.com](https://api.esy.com).

**Status:** In progress. Spec complete. Integration not yet started.
**Owner:** Zev (ESY LLC)
**Target:** Remove all direct AI provider calls from clip.art. clip.art becomes a pure ESY consumer.

---

## Start here

Open these three files in order if you're about to do migration work:

1. [`04-migration-tracker.md`](04-migration-tracker.md) — **what to change**. File-by-file status with today's state, deferred work, and concrete diffs.
2. [`02-api-contract.md`](02-api-contract.md) — **what to call**. ESY's `/generate`, `/batches`, and status endpoints with request/response shapes.
3. [`03-migration-plan.md`](03-migration-plan.md) — **in what order**. Phased rollout with rollback steps.

Everything else is reference.

---

## Full index

| # | Document | Purpose |
|---|---|---|
| 00 | [Overview](00-overview.md) | What ESY is, what it owns, scope boundary |
| 01 | [Architecture](01-architecture.md) | Target architecture diagram + separation of concerns |
| 02 | [API Contract](02-api-contract.md) | Endpoints, request/response shapes, error codes, types |
| 03 | [Migration Plan](03-migration-plan.md) | Phased rollout with rollback path |
| 04 | [Migration Tracker](04-migration-tracker.md) | File-by-file status, deferred work, blockers |
| 05 | [Decision Log](05-decision-log.md) | Dated architectural decisions |
| — | [Backlinks](backlinks.md) | SEO attribution links from clip.art → esy.com (separate from migration) |

### Consumer-side patterns ESY inherits

These docs live outside `docs/esy/` because they're clip.art features, but they define patterns ESY needs to preserve post-migration.

- [docs/features/WORKSHEETS.md](../features/WORKSHEETS.md) — worksheets content type. Taxonomy, URL architecture, create/browse/detail surfaces, sitemap.
- [docs/features/CONTENT_GENERATION_SAFETY.md](../features/CONTENT_GENERATION_SAFETY.md) — **prompt-composition + per-theme safety-enforcement pattern**. Shared `_characters.json` + `_safety.json` injected into every prompt and used as the HITL reviewer checklist. First shipped theme: `hiphop`. Structure generalizes to any future culturally-sensitive theme. ESY should inherit this exact structure as its batch-safety library.
- [docs/features/BATCH_MODE.md](../features/BATCH_MODE.md) — how clip.art submits large image-generation jobs via OpenAI's Batch API (50% off, 24h SLA). Plan → submit → poll → collect pipeline, JSONL shape, and "bring your own 1,000 prompts" flow. ESY replaces this wrapper with `POST /v1/batches`.

### Strategy context

- [2026-03-21 — clip.art & ESY strategy session](sessions/2026-03-21-strategy.md)

### Superseded

- [`legacy/template-runner-api.md`](legacy/template-runner-api.md) — The April 2026 "template-to-artifact engine" (worksheet) spec. ESY pivoted to generation infrastructure; that spec is not being built.

---

## Current state (today)

| Area | Status |
|---|---|
| ESY API implemented | ❌ Not yet |
| ESY auth/keys issued | ❌ Not yet |
| clip.art consumer code | ❌ Not yet |
| Migration spec | ✅ Complete |
| Admin UI for model/quality routing | ✅ Shipped (to be replaced by ESY dashboard later) |
| `gpt-image-1.5` wired in | ✅ Shipped today |
| OpenAI Batch API wiring | ⏸ **Deferred for ESY** — catalog ready, not in runtime |

For the full file-level breakdown see [04-migration-tracker.md](04-migration-tracker.md).
