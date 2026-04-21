# 03 · Migration Plan

Phased rollout for moving clip.art from direct-provider calls to ESY. Each phase is independently shippable and independently reversible.

For the per-file status of what's already done and what's pending, see [04-migration-tracker.md](04-migration-tracker.md).

---

## Preconditions (before phase 1)

- [ ] ESY API deployed to staging with `/v1/health`, `/v1/generate`, `/v1/batches`
- [ ] `ESY_API_KEY` issued for clip.art (staging + prod)
- [ ] ESY has access to Gemini + OpenAI keys (env moved from clip.art to ESY)
- [ ] ESY has R2 bucket credentials
- [ ] `clip.art/src/lib/styles.ts` and ESY's `StyleKey` union verified byte-identical
- [ ] Rollback plan: feature flag `ESY_ENABLED=true|false` short-circuits back to legacy path

---

## Phase 1 · User-initiated generation (thin proxy)

**Goal:** Replace `app/api/generate/route.ts`'s inline generation with a call to `POST /v1/generate`.

### Steps

1. **Add ESY client** — `src/lib/esyClient.ts` with `generate()`, `submitBatch()`, `getBatch()`, `getBatchResults()`.
2. **Gate with feature flag** — `ESY_ENABLED` env var; when false, use legacy path verbatim.
3. **Rewrite `app/api/generate/route.ts`:**
   - Keep: auth, credit check, safety check (temporarily), DB insert, credit deduction
   - Replace: call to `generateImage()` + `sharp()` + `r2Upload()` + `classifyPrompt()` → single `esyClient.generate()` call
   - Map ESY response directly onto `generations` table insert shape
4. **Shadow mode** — run ESY call alongside legacy, compare outputs, log diffs. No user-visible change.
5. **Cut over** — flip `ESY_ENABLED=true` for 1% of users, ramp to 100% over a week.
6. **Delete legacy** — remove `src/lib/imageGen.ts`, `src/lib/gptImage1.ts`, `src/lib/gptImage15.ts`, `src/lib/gptImage2.ts`, `src/lib/r2.ts`, `src/lib/classify.ts`, `src/lib/promptSafety.ts` imports from the generate route.

### Rollback

Flip `ESY_ENABLED=false`. Legacy code still compiled until Phase 3.

### Acceptance

- `/create` page generates images identical to today (visual QA on 20 images across all styles)
- Credit deduction unchanged
- Response latency ≤ legacy p95 + 500ms (ESY adds one network hop)
- No `OPENAI_API_KEY` or `GEMINI_API_KEY` usage in runtime logs

---

## Phase 2 · Batch generation

**Goal:** Retire `scripts/seed-animal-clipart.ts`. All batch work goes through `POST /v1/batches`.

### Steps

1. **Build dashboard-side configs** in `app.esy.com` for clip.art's existing batch templates (animals by letter, color families, etc.).
2. **Write parity test** — seed 50 images via script vs 50 via ESY batch, compare outputs.
3. **Migrate seed scripts to thin invokers** — `scripts/seed-animal-clipart.ts` becomes a ~20-line script that POSTs to `/v1/batches` with the right config and polls for completion, inserting results into `generations`. Or delete it entirely if the ESY dashboard handles scheduling.
4. **Switch on OpenAI Batch API** — ESY uses provider-native batch APIs for `gpt-image-*` (50% off, 24h SLA). This is the reason OpenAI batch wiring was deferred in clip.art today — it belongs in ESY.
5. **Delete `scripts/seed-animal-clipart.ts`** once ESY dashboard owns the schedule.

### Rollback

Keep the old script checked in on a branch. Re-enable by reverting the deletion commit and ensuring `OPENAI_API_KEY` / `GEMINI_API_KEY` are still in the env.

### Acceptance

- A scheduled batch of 1000 clipart images runs end-to-end through ESY
- Cost reporting in ESY dashboard matches within 2% of OpenAI billing dashboard
- All 16 known pipeline issues (see below) are addressed or explicitly deferred

---

## Phase 3 · Sunset clip.art-side provider code

**Goal:** Remove all direct AI provider integration from clip.art. `ESY_API_KEY` is the only ESY-related env var.

### Steps

1. Delete `src/lib/imageGen.ts`, `src/lib/gptImage1.ts`, `src/lib/gptImage15.ts`, `src/lib/gptImage2.ts`, `src/lib/gemini.ts`, `src/lib/r2.ts`, `src/lib/classify.ts`, `src/lib/promptSafety.ts`.
2. Delete admin API routes that overlap with ESY's routing control:
   - `app/api/admin/settings/model-config/route.ts` — routing moves to ESY dashboard
   - `app/api/admin/settings/model-quality-config/route.ts` — routing moves to ESY dashboard
3. Keep `src/lib/imageModelCatalog.ts` for **display-only pricing context** (the admin "which model is cheapest" matrix). Mark generation-specific fields (e.g. `params`, `exampleCall`) as display-only documentation.
4. Delete `app/admin/models/` page — its purpose shifts to the ESY dashboard. Replace with a stub that links out to `app.esy.com`.
5. Remove `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, and all `R2_*` env vars from clip.art deployment.
6. Update `CLAUDE.md`, Cursor rules, and `docs/PRODUCT_ARCHITECTURE.md` to reflect new state.

### Rollback

Not trivially reversible. Gate Phase 3 behind a 30-day soak of Phase 1 + 2 in production.

---

## Phase 4 · Animations

Animations use a completely separate pipeline (Kling via fal.ai, video output, `animations` table). Lower priority — handle after image pipeline is stable.

### Steps

1. Add `/v1/animations` (or `type: "animation"` on `/v1/batches`) to ESY API.
2. ESY handles: fal.ai calls, source image fetch, video storage (separate bucket), thumbnail/preview/last-frame derivation.
3. Migrate `app/api/animate/route.ts` similar to Phase 1.
4. Delete fal.ai integration from clip.art.

---

## Known pipeline issues (must be solved by ESY)

Pulled from the original workflow doc. These are the 16 concrete gaps in clip.art's current pipeline that ESY must fix. Migration is not complete until each is addressed.

1. **Slug collision risk** — Random 6-char suffix has non-trivial collision probability at scale. ESY needs deterministic, collision-checked slug generation.
2. **Descriptions bypass classification** — Batch scripts hardcode templated descriptions. ESY must run classify on every generation.
3. **Formulaic titles** — Different poses of same animal get identical titles. ESY must generate unique titles per image.
4. **No image quality verification** — Zero post-generation checks. ESY must implement automated quality scoring.
5. **No retry or dead-letter queue** — Failed generations are logged and lost. ESY must track every job attempt with status and error classification.
6. **No cost tracking or budget controls** — ESY must track cost per generation and enforce budget caps.
7. **Prompt diversity ceiling** — 242 templates with deterministic assignment. ESY must track used combos per subject and generate novel ones.
8. **No asset type generalization** — Script is hardcoded for clip art. ESY must be content-type-agnostic.
9. **No scheduling or orchestration** — Manual CLI only. ESY must provide scheduled, resumable, isolated batch execution.
10. **No HITL workflow** — Images go straight to `is_public: true`. ESY must implement staging → review → approve/reject flow.
11. **R2 orphan management** — If Supabase insert fails after R2 upload, image is orphaned. ESY must ensure atomic operations.
12. **Hardcoded category assignment** — Script hardcodes `animals-that-start-with-{letter}`. ESY must use classification for all category assignment.
13. **No provenance or batch tracking** — No `batch_id`, `run_id`, `generated_by`. ESY must tag every generation with full provenance.
14. **Sitemap explosion** — Current clip.art query limits sitemap to 5000 entries; will overflow. Not ESY's problem, but ESY's output rate drives it. clip.art needs sitemap index splitting.
15. **Search vector gap** — Batch-generated images don't populate `search_vector`. ESY must ensure all metadata fields needed for downstream indexing are populated.
16. **No variation tracking** — No record of which pose/style/variation combos have been generated per subject. ESY must maintain a variation matrix.
