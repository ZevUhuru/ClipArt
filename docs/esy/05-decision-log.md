# 05 · Decision Log

Dated architectural decisions about the ESY migration. Newest first. Each entry is permanent — don't rewrite history, add a new entry that supersedes.

---

## 2026-04-21 · Defer OpenAI Batch API runtime wiring to ESY

**Decision:** Record OpenAI Batch API support (50% off, 24h SLA) in `src/lib/imageModelCatalog.ts` and surface it in admin UI, but do NOT wire batch mode into `src/lib/imageGen.ts`.

**Rationale:** Per this repo's ESY migration rules, generation pipeline code (`imageGen.ts` and the `gptImage*.ts` wrappers) is being replaced by ESY. Adding batch routing to a dead-man-walking module is wasted work and adds another thing to rewrite. The catalog metadata is in place for ESY to consume when it takes over routing.

**Owner:** ESY to implement in Phase 2. Use provider-native batch endpoints (`/v1/images/generations` on OpenAI, equivalent on Gemini) and route batch-eligible workloads (all seeding, any `batch_mode: true` request) through them.

**Status:** Deferred.

---

## 2026-04-21 · `gpt-image-1.5` is the recommended default over `gpt-image-1`

**Decision:** Default OpenAI model for new configurations is `gpt-image-1.5`. `gpt-image-1` remains selectable but marked "Legacy".

**Rationale:** `gpt-image-1.5` is cheaper at every quality tier and aspect (medium 1024² is $0.034 vs $0.042, ~19% savings), preserves transparent-background support (`gpt-image-2` drops it), and the output quality is comparable for clipart/illustration workloads.

**Impact on migration:** The `ModelKey` union in `src/lib/styles.ts` and ESY's own routing union must include `gpt-image-1.5`. The API contract in [02-api-contract.md](02-api-contract.md) reflects this.

**Status:** Active — `gpt-image-1.5` wrapper added, admin UI updated, one-shot migration script for existing configs shipped.

---

## 2026-04-21 · Drop the "dalle" name

**Decision:** Rename all code and DB references from `dalle` to `gpt-image-1`.

**Rationale:** The internal key `dalle` was misleading — the model had always been OpenAI `gpt-image-1`, not DALL·E 3. Keeping the wrong name made reasoning about pricing and capabilities harder.

**Migration:** `db/rename-dalle-to-gpt-image-1.sql` applied in prod. All TypeScript references updated. `ModelKey` union no longer contains `"dalle"`.

**Status:** Shipped.

---

## 2026-04-XX · ESY pivots from template-runner to generation infrastructure

**Decision:** ESY's first product is clip.art's **generation infrastructure**, not a **template-to-artifact engine** (worksheets, PDFs).

**Rationale:**
- The template runner concept (see [legacy/template-runner-api.md](legacy/template-runner-api.md)) targeted a worksheet/PDF use case that wasn't validated by clip.art's traffic.
- The generation pipeline in clip.art has concrete known gaps (16 issues documented in [03-migration-plan.md](03-migration-plan.md)) and is production-critical.
- Building ESY as generation infrastructure for clip.art first means the dashboard and API are battle-tested on real traffic before opening to external users.
- Template/artifact engine can be re-introduced later as a higher layer built on top of the generation infrastructure.

**Impact:** `docs/esy/api-design.md` (template runner spec) is superseded; moved to `docs/esy/legacy/`. `docs/CONTENT_GENERATION_WORKFLOWS.md` becomes the primary spec, split across `00-overview.md`, `01-architecture.md`, `02-api-contract.md`, `03-migration-plan.md`.

**Status:** Active — current direction.

---

## 2026-03-21 · clip.art stays consumer-facing; ESY stays infrastructure

**Decision:** clip.art owns UI, SEO, credits, monetization. ESY owns generation, processing, storage. Neither crosses the boundary.

**Rationale:** Covered in depth in the [strategy session](sessions/2026-03-21-strategy.md). The core reasoning: ESY is engineer-first and infrastructure-focused; clip.art is consumer-facing with SEO-driven growth. Conflating the two produces a product that's neither.

**Impact:** Every downstream decision about the API contract, data ownership, and env vars flows from this.

**Status:** Active — foundational.
