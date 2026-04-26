# Batch Mode — How clip.art submits large image-generation jobs

> The thin wrapper clip.art uses around OpenAI's Batch API to run 100s–1000s of image generations at 50% cost with 24-hour SLA. Designed to migrate cleanly to ESY's batch service.

## What "batch mode" actually is

**It is not a clip.art-internal batch system.** clip.art doesn't own a job queue, doesn't manage workers, doesn't run crons. "Batch mode" in this repo is:

1. A **convention** for composing a JSONL file where each line is one image-generation request.
2. A **script** that uploads that file to OpenAI's Batch API, creates the batch job, and — on a second invocation — collects the results, converts to WEBP, uploads to R2, and inserts into Supabase.

The actual execution — the concurrency, rate-limit management, retries — all happens inside OpenAI's infrastructure. We hand them a list of requests and they run it.

Why this matters for future understanding:

- When we say "we batched 1,000 worksheets," we mean: we wrote 1,000 lines to a JSONL file and handed it to OpenAI's Batch API.
- The script is stateless between submission and collection. The state lives in OpenAI's batch job (identified by a `batch_id`) and in a small local metadata file we write alongside the JSONL.
- We pay OpenAI 50% of the sync price and they guarantee a 24-hour turnaround.

Post-ESY migration, this wrapper disappears. ESY owns provider routing and handles batch dispatch as part of `POST /v1/batches`. This doc preserves the architecture so ESY can inherit it cleanly.

## The pipeline

```
┌──────────────────────────────────────────────────────────────┐
│ SOURCE (any one of these produces a list of composed prompts) │
├──────────────────────────────────────────────────────────────┤
│ A. scripts/seed-worksheets/configs/*.json                    │
│    (default — safety + themes + characters → prompts)         │
│ B. --prompts-file my-1000-prompts.jsonl                       │
│    (bring your own pre-composed prompts)                      │
│ C. --prompt "single prompt"                                   │
│    (ad-hoc single request, mostly for testing)                │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ PLAN                                                          │
│  Output: .batches/<batch-name>/                               │
│    ├── requests.jsonl    (one line per image to generate)    │
│    └── meta.json         (custom_id → {grade, subject,        │
│                           topic, theme, character, ...} map) │
│                                                              │
│  custom_id is deterministic: matches the slug the sync path  │
│  would have produced. So SKIP_EXISTING still works for       │
│  resumes / partial re-runs.                                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ SUBMIT                                                        │
│  1. Upload requests.jsonl via OpenAI Files API (purpose:      │
│     "batch"). Receive file_id.                                │
│  2. Create batch job:                                         │
│       POST /v1/batches                                        │
│         { input_file_id: <file_id>,                           │
│           endpoint: "/v1/images/generations",                 │
│           completion_window: "24h" }                          │
│     Receive batch_id.                                         │
│  3. Write batch_id + file_id + submission timestamp into      │
│     .batches/<batch-name>/submission.json.                    │
│  4. Print batch_id for the operator.                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ POLL (optional — can also be skipped if using webhooks)      │
│  GET /v1/batches/<batch_id> every N minutes until status      │
│  is "completed" | "failed" | "cancelled" | "expired".         │
│  Print running totals (done / total / errors).                │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ COLLECT                                                       │
│  1. Download output_file_id → .batches/<batch-name>/          │
│       results.jsonl                                           │
│     Each line: { custom_id, response: { body: { data[0]:      │
│                                         b64_json } } }        │
│  2. For each line:                                            │
│     a. Look up metadata by custom_id in meta.json             │
│     b. Decode b64 → Buffer                                    │
│     c. sharp(buffer).webp({ quality:85 }).toBuffer()          │
│     d. Upload to R2 at worksheets/{grade}/{subject}/          │
│        {topic}/{custom_id}.webp                               │
│     e. Insert into generations with content_type='worksheet'  │
│  3. For any errored line: log and move on; operator re-runs   │
│     with --retry-errors later.                                │
└──────────────────────────────────────────────────────────────┘
```

## JSONL request shape

Each line in `requests.jsonl` is one request:

```json
{
  "custom_id": "1st-grade-math-addition-dinosaurs-asian-girl-3",
  "method": "POST",
  "url": "/v1/images/generations",
  "body": {
    "model": "gpt-image-2-2026-04-21",
    "prompt": "A cute cartoon kid character solving a single-digit addition worksheet...",
    "size": "1024x1536",
    "quality": "high",
    "n": 1
  }
}
```

Constraints to remember:

- `custom_id` must be unique within a batch, max 64 chars. Our slug shape (`{grade}-{subject}-{topic}-{theme}-{character}-{idx}`) fits.
- The JSONL file must be under 200 MB. At ~1.5 KB per line, that caps us around ~130,000 requests per batch. A 1,000-image batch is ~1.5 MB.
- Model id is pinned per [model-pinning rule](/.cursor/rules/model-pinning.mdc). Never `chatgpt-image-latest`, never `*-latest`.

## Bringing your own 1,000 prompts

The `--prompts-file` flag accepts a JSONL where each line is:

```json
{ "prompt": "A cute cartoon fox reading a book...", "custom_id": "my-fox-1", "meta": { "category": "animals", "style": "cartoon" } }
```

- `prompt` (required) — the composed prompt string. No safety injection happens; you are responsible for the prompt you submit.
- `custom_id` (optional, auto-generated if missing) — used as the asset slug.
- `meta` (optional) — arbitrary JSON object passed through to `meta.json`. The collect phase can route based on this (e.g. decide which R2 prefix and `category` column to use).

Typical flow:

```bash
# 1. Plan + submit
npx tsx scripts/seed-worksheets.ts \
  --mode batch \
  --prompts-file my-1000-prompts.jsonl \
  --batch-name my-2026-04-28-run

# Prints: batch_id = batch_abc123

# 2. Poll (or wait for webhook, or come back later)
npx tsx scripts/seed-worksheets.ts \
  --mode poll --batch-name my-2026-04-28-run

# 3. Collect when status = completed
npx tsx scripts/seed-worksheets.ts \
  --mode collect --batch-name my-2026-04-28-run
```

The `.batches/<batch-name>/` directory is the single source of state for each run. You can archive or delete it after the collect phase completes successfully.

## What the script does *not* do

On purpose, to keep the wrapper thin:

- **No retry orchestration.** If a batch line errors, it stays errored. Re-run that specific `custom_id` via a follow-up `--mode batch --prompts-file <just-the-errored-ones>.jsonl`. Keeps logic simple; OpenAI-side retries already happen inside the batch window.
- **No progress UI beyond log lines.** For 1,000-image batches this is fine. For anything bigger, use OpenAI's platform dashboard.
- **No cost accounting.** We estimate up front; OpenAI's usage dashboard shows actuals.
- **No batching across providers.** Only OpenAI `/v1/images/generations` today. Gemini batch (if/when we use it) would be a second script or a flag.

Everything more sophisticated (queues, retries, multi-provider routing, budget caps, HITL holds) lives in ESY post-migration. See [docs/esy/](../esy/README.md).

## Failure modes and how to recover

| Failure | What happens | Recovery |
|---|---|---|
| Upload fails (network, auth, 413) | No batch created. `.batches/<batch-name>/` has only `requests.jsonl`. | Re-run `--mode submit --batch-name <name>`. |
| Create-batch rejects (400, bad JSONL) | No batch created. Error tells you which line. | Fix the line, re-run submit. |
| Batch status = `failed` | OpenAI gives a reason. | Check dashboard, fix, re-run with a fresh batch-name. |
| Batch status = `expired` | 24h window elapsed before all requests processed. | Partial results may be available — collect what you can, re-batch the rest. |
| Single request errors inside batch | Others still succeed. Output JSONL includes `error` lines. | Collect phase logs errors; re-run with a filtered `--prompts-file`. |
| Collect crashes mid-way | R2 + Supabase inserts are idempotent via deterministic slug. | Re-run `--mode collect` — `SKIP_EXISTING` short-circuits already-done rows. |

## Cost comparison (gpt-image-2, 1024×1536, high quality)

| Mode | Per image | 1,000 images | 10,000 images |
|---|---|---|---|
| Sync (`images.generate` calls) | $0.165 | $165 | $1,650 |
| Batch | **$0.0825** | **$82.50** | **$825** |

The batch discount is the same 50% as text batch — OpenAI explicitly confirms this in the Batch API docs.

## ESY migration note

Post-migration, everything in this doc is replaced by a single ESY call:

```
POST {ESY}/v1/batches
  { prompts: [...], model: "gpt-image-2-2026-04-21",
    options: { ... } }
```

ESY handles:

- Provider selection (OpenAI batch vs. Gemini batch vs. sync)
- Dated-snapshot pinning (enforced per [model-pinning rule](/.cursor/rules/model-pinning.mdc))
- Cost tracking / budget caps
- HITL review integration
- Retry policy with dead-lettering
- Webhook-driven collect phase (no polling)
- Multi-tenant isolation

The JSONL shape documented here is intentionally close to the OpenAI Batch API shape so ESY can accept clip.art's existing batch definitions with minimal adaptation. See [docs/esy/02-api-contract.md](../esy/02-api-contract.md).

## Where to look next

- [.cursor/rules/model-pinning.mdc](/.cursor/rules/model-pinning.mdc) — the rule that forbids `*-latest` aliases.
- [WORKSHEETS.md](WORKSHEETS.md) — the worksheets content type that kicked off batch mode.
- [CONTENT_GENERATION_SAFETY.md](CONTENT_GENERATION_SAFETY.md) — prompt composition pipeline (feeds the batch planner).
- [docs/esy/04-migration-tracker.md](../esy/04-migration-tracker.md) — file-by-file ESY migration status.
- [docs/esy/05-decision-log.md](../esy/05-decision-log.md) — architectural decisions including batch deferral and model pinning.
