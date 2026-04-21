# 02 · API Contract

The ESY API contract that clip.art consumes. This doc is the **source of truth for integration work** — write the ESY API to this spec, write clip.art's client against this spec.

**Base URL:** `https://api.esy.com` (prod), `https://api.staging.esy.com` (staging)
**Auth:** `Authorization: Bearer {ESY_API_KEY}` on every request
**Content type:** `application/json` (request + response)
**Versioning:** URL-versioned (`/v1/...`). Breaking changes ship under `/v2/...`.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/generate` | Synchronous single-image generation (user-initiated) |
| `POST` | `/v1/batches` | Submit an async batch job |
| `GET`  | `/v1/batches/{id}` | Poll batch status |
| `GET`  | `/v1/batches/{id}/results` | Stream completed items from a batch |
| `POST` | `/v1/batches/{id}/cancel` | Cancel an in-flight batch |
| `GET`  | `/v1/generations/{id}` | Fetch a single generation by ID |
| `GET`  | `/v1/health` | Liveness check |

---

## `POST /v1/generate` — synchronous generation

The hot-path endpoint clip.art calls for user-initiated generation (replaces `app/api/generate/route.ts`'s inline logic).

### Request

```typescript
interface GenerateRequest {
  // What to generate
  subject:       string;              // e.g. "red fox"
  prompt?:       string;              // raw user prompt; ESY decides how to use
  style:         StyleKey;            // "flat" | "cartoon" | "watercolor" | ...
  content_type:  "clipart" | "coloring" | "illustration";
  aspect_ratio?: "1:1" | "3:4" | "4:3";

  // How to generate (optional — ESY picks defaults from its routing config)
  model?:        ModelKey;            // override routing
  quality?:      "low" | "medium" | "high";
  batch_mode?:   boolean;             // if true, returns 202 + job id (use /batches for real batch workflows)

  // Provenance
  client_id:     "clip.art" | string; // for attribution / rate-limiting per consumer
  user_id?:      string;              // clip.art user id, if user-initiated
  idempotency_key?: string;           // dedupes retries

  // Classification hints (optional)
  preferred_category?: string;        // e.g. "animals" — ESY still validates
  tags_hint?:          string[];
}
```

### Response — 200 OK

```typescript
interface GenerateResponse {
  // The artifact
  generation_id: string;
  image_url:     string;              // R2 URL, ESY-owned bucket
  width:         number;
  height:        number;
  encoding:      "image/webp";

  // Enriched metadata (from ESY classify pipeline)
  title:         string;              // 3-8 words, <=60 chars
  slug:          string;              // <=40 chars, URL-safe, collision-checked
  description:   string;              // 150-300 chars, 2-3 sentences, unique
  category:      string;              // slug
  tags:          string[];

  // Provenance
  provider:      "gemini" | "openai";
  model:         string;              // e.g. "gpt-image-1.5"
  quality:       "low" | "medium" | "high" | "default";
  cost_usd:      number;              // ESY's cost (for clip.art's margin calc)
  generated_at:  string;              // ISO 8601

  // Quality review
  review_status: "auto_approved" | "needs_review" | "approved";
  quality_score: number;              // 0-100
}
```

### Error responses

| Code | `error.code` | Meaning | Client action |
|---|---|---|---|
| 400 | `invalid_request` | Bad payload | Fix and retry |
| 401 | `unauthorized` | Bad API key | Check `ESY_API_KEY` |
| 402 | `quota_exceeded` | Consumer quota hit | Back off, raise limit |
| 422 | `safety_rejected` | Prompt blocked by safety filter | Show user "try different prompt" |
| 429 | `rate_limited` | Too many requests | Retry with backoff (respect `Retry-After`) |
| 502 | `provider_failed` | Upstream AI provider failed after retries | Retry later |
| 503 | `hitl_required` | Output sent to human review queue (sync mode) | Fall back to async (`/batches`) |
| 500 | `internal_error` | ESY-side bug | Log, retry idempotently |

Error shape:

```json
{
  "error": {
    "code": "safety_rejected",
    "message": "Prompt violated safety policy.",
    "detail": "...",
    "retryable": false
  }
}
```

---

## `POST /v1/batches` — async batch jobs

Replaces `scripts/seed-animal-clipart.ts`. Also the target for anything that can tolerate a 24h window so clip.art gets the 50%-off batch pricing on every supported provider (Gemini, OpenAI — both support batch on `/images/generations`).

### Request

```typescript
interface BatchRequest {
  type: "clipart" | "coloring" | "illustration" | "animation";

  // What to generate
  subject_source: "animal_entries" | "category_seed" | "custom_list";
  subjects:       string[];
  styles:         StyleKey[];
  images_per_subject: number;

  // Routing (optional)
  providers?:    ProviderConfig[];
  concurrency?:  { gemini?: number; openai?: number };
  batch_api?:    boolean;   // if true, use provider-native batch APIs (-50% cost, 24h SLA)

  // Scheduling (optional)
  scheduled_at?:  string;   // ISO 8601
  daily_limit?:   number;

  // Safety
  max_cost_usd?:  number;   // hard cap; ESY aborts if exceeded

  // Provenance
  client_id:   string;
  run_name?:   string;
}

interface ProviderConfig {
  name:    "gemini" | "openai";
  model:   string;
  quality: "low" | "medium" | "high";
  weight:  number;          // e.g. 0.5 = 50% split
}
```

### Response — 202 Accepted

```typescript
interface BatchResponse {
  batch_id:    string;
  status:      "queued" | "running" | "completed" | "failed" | "paused";
  total_planned:   number;
  total_completed: number;
  total_failed:    number;
  cost_estimate_usd: number;
  created_at:  string;
  eta:         string;     // ISO 8601
}
```

---

## `GET /v1/batches/{id}` — status poll

Returns the same `BatchResponse` shape with updated counters.

Clients should poll at ≥10s intervals and respect `Cache-Control` headers.

---

## `GET /v1/batches/{id}/results`

Streams completed items as NDJSON. Each line is a `GenerateResponse`. Supports `?since={iso}` for incremental pulls so clip.art can insert into its `generations` table as things complete.

---

## Shared types

```typescript
type StyleKey =
  | "flat" | "cartoon" | "watercolor" | "vintage" | "3d"
  | "doodle" | "kawaii" | "outline" | "sticker" | "chibi"
  | "pixel" | "coloring";

type ModelKey =
  | "gemini"
  | "gpt-image-1"
  | "gpt-image-1.5"   // added today 2026-04-21 — see decision log
  | "gpt-image-2";
```

These mirror `src/lib/styles.ts` exactly. Keep them in sync when adding styles/models.

---

## Quality checks (internal to ESY)

clip.art doesn't call these — they run inside the generation pipeline — but the shape matters because it shows up on the response:

```typescript
interface QualityCheck {
  has_white_background: boolean;
  is_isolated_object:   boolean;
  resolution_ok:        boolean;
  file_size_ok:         boolean;
  safety_passed:        boolean;
  matches_prompt:       boolean;
  quality_score:        number;  // 0-100
  human_approved?:      boolean;
  reviewer_notes?:      string;
  status: "auto_approved" | "needs_review" | "rejected";
}
```

A generation is only returned from `/generate` or `/batches/{id}/results` when `status` is `auto_approved` or (post-HITL) `approved`. Rejected generations are silently dropped from the delivery stream.

---

## Rate limits

| Endpoint | Limit | Notes |
|---|---|---|
| `POST /v1/generate` | 60/min per `client_id` | Per-user limits enforced by clip.art before calling |
| `POST /v1/batches` | 10/hour per `client_id` | Each batch can hold 50k subjects |
| Polling endpoints | 600/min per `client_id` | Use `?since=` to avoid polling large result sets |

Exceeding: `429` with `Retry-After` header.

---

## Idempotency

`POST /v1/generate` and `POST /v1/batches` both accept `Idempotency-Key` header. ESY dedupes on (`client_id`, `Idempotency-Key`) within 24h. Required for safe retries from clip.art's API route.
