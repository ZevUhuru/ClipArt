# 05 · Decision Log

Dated architectural decisions about the ESY migration. Newest first. Each entry is permanent — don't rewrite history, add a new entry that supersedes.

---

## 2026-04-26 · Clip art storage format: transparent PNG as master, white bg for display

**Decision:** All clip art generations are stored as transparent-background WebP (alpha channel preserved). White background is a display-only concern handled by CSS — never baked into the stored file. Users can toggle between preview backgrounds in the detail view.

**Rationale:**
- Clip art's primary use case is compositing onto other surfaces (Canva, slides, documents, t-shirts, etc.). A white background baked into the file makes it less useful for the majority of professional use cases.
- A user with 0 credits attempted to purchase the $4.99 pack 3 times but did not convert. Analysis of their Clarity session revealed they were generating character clip art with inconsistent backgrounds — 5/10 images came back with opaque white backgrounds despite not requesting one. The inconsistency is the direct conversion blocker: a user evaluating quality cannot trust the product when output is non-deterministic on the most basic attribute.
- Going transparent → white is a trivial CSS rule. Going white → transparent requires background removal (additional cost, quality loss on complex edges, extra latency). Transparent is the better master.
- The `background: "transparent"` API param on gpt-image-2 produces pixel-perfect alpha — no background removal needed, no edge artifacts.

**What changed (2026-04-26):**
- `src/lib/gptImage2.ts` — added `background` param, corrected wrong comment (gpt-image-2 DOES support transparency via `background: "transparent"`)
- `src/lib/gptImage1.ts`, `src/lib/gptImage15.ts` — added `background` param, corrected comment in 1.5 that incorrectly claimed gpt-image-2 drops transparency
- `src/lib/imageGen.ts` — derives `background: "transparent"` when `contentType === "clipart"`, passes through to all GPT wrappers
- `src/lib/styles.ts` — clipart template updated from `"plain white background"` to `"transparent background, no background"`

**Gemini caveat:** Gemini Flash Image does not reliably honor transparency even when prompted. Resolution: route clipart exclusively to gpt-image-2 (which is already the active model for user generations). Gemini remains the default for illustrations and coloring pages where transparency is irrelevant.

**Display strategy:**
- `ImageCard` clipart tiles: render image on `bg-white` card (already effectively the case; `bg-gray-50/80` is close enough and will look correct with transparent images)
- Detail page: background-toggle control (white / light gray / dark / transparent/checkered) so users can preview the image on different surfaces before downloading
- Download options: transparent PNG (master), white bg PNG (derived client-side or server-side on request), future SVG (vectorization requires transparent PNG as input — this architecture supports it without additional processing)

**Catalog inconsistency note:** Existing catalog images were generated with white backgrounds. New generations will have transparent backgrounds. The Library will show a mixed set during the transition. This is acceptable — old images are still usable, and the inconsistency fades as new content is generated. No backfill planned unless a background-removal batch job becomes cost-effective.

**Carry-forward to ESY:** ESY's generation pipeline must preserve the `background` parameter in the API contract for clipart requests. The `contentType` field in the request is sufficient signal — ESY should default to `background: "transparent"` whenever `content_type === "clipart"`.

**Status:** Active — shipped 2026-04-26.

---

## 2026-04-22 · Ban vague model aliases in API requests

**Decision:** All AI-provider API calls in this repo must use explicit, dated model snapshots (e.g. `gpt-image-2-2026-04-21`) or documented major-version ids (e.g. `gpt-image-2`). Marketing aliases that cross major versions (`chatgpt-image-latest`, `gpt-image-latest`, `*-default`, `*-auto`) are banned outright for anything that persists output to DB/R2.

**Rationale:** Twice in this codebase we have shipped the wrong model because an alias drifted or was misleading:
1. `gemini-2.5-flash-image` stayed wired in as the default long after Gemini 3.1 Flash Image Preview (Nano Banana 2) shipped.
2. `chatgpt-image-latest` was used in seed scripts under the mistaken assumption it tracked "the newest ChatGPT image model." OpenAI's own docs state the alias points at the pre-2.0 model; API users should call `gpt-image-2` directly.

Both cost real money — wrong model, wrong quality, wrong style, catalog-wide.

**Enforcement:**
- New cursor rule `.cursor/rules/model-pinning.mdc` (always-applied) spells out the rule and the checklist.
- Seed scripts (`scripts/seed-worksheets.ts`, `scripts/seed-animal-clipart.ts`) now pin to `gpt-image-2-2026-04-21`.
- `CLAUDE.md` updated to reflect `gpt-image-2` as the OpenAI default and explicitly call out `chatgpt-image-latest` as the wrong choice.

**Carry-forward to ESY:** ESY's provider routing layer inherits this rule — the batch-safety library and batch definitions must encode dated snapshots at the source, not resolve aliases at dispatch time. A batch definition from 2026-04-22 should generate the same output if replayed in 2027-04-22.

**Status:** Active.

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
