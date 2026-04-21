# Content Generation Workflows

Reference document for all content creation pipelines used by clip.art and the specification for ESY as the infrastructure layer that will own generation, quality control, scheduling, and asset lifecycle management.

---

## Part 1: clip.art and ESY — Architectural Relationship

### Vision

clip.art is the consumer-facing product. ESY is the infrastructure layer that powers it.

clip.art handles user experience, SEO, display, and monetization. ESY handles everything related to producing and managing the underlying assets — generation, provider routing, retries, quality gates, storage, metadata enrichment, batch scheduling, and cost controls.

### Target Architecture

```
┌──────────────────────────────────────────────────────┐
│                    clip.art (Next.js)                 │
│                                                      │
│  User-facing app: browse, search, download, create   │
│  SEO pages, detail pages, galleries, animations      │
│                                                      │
│  Owns: UI, routing, auth, credits, SEO, display      │
│  Does NOT own: generation logic, provider calls,     │
│  image processing, storage orchestration             │
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
│                   ESY (app.esy.com)                   │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Dashboard   │  │   API        │  │  Workers   │  │
│  │  (control    │  │   (execution │  │  (batch    │  │
│  │   plane)     │  │    plane)    │  │   runners) │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                      │
│  Owns: provider routing, retries, quality scoring,   │
│  HITL review queues, batch scheduling, cost tracking,│
│  image processing (sharp/WEBP), storage (R2),        │
│  metadata enrichment (classify), provenance          │
│                                                      │
│         ┌──────────────────────────┐                 │
│         │  AI Providers            │                 │
│         │  - Google Gemini         │                 │
│         │  - OpenAI (chatgpt-img)  │                 │
│         │  - Future providers      │                 │
│         └──────────────────────────┘                 │
│                                                      │
│         ┌──────────────────────────┐                 │
│         │  Storage                 │                 │
│         │  - Cloudflare R2         │                 │
│         │  - Supabase (metadata)   │                 │
│         └──────────────────────────┘                 │
└──────────────────────────────────────────────────────┘
```

### What Changes in clip.art

Today, clip.art calls OpenAI and Gemini directly from its own API routes (`/api/generate`, `src/lib/imageGen.ts`, `src/lib/gptImage1.ts`, `src/lib/gptImage2.ts`). It handles R2 uploads, WEBP conversion, and classification inline.

After ESY integration, clip.art's generate route becomes a thin proxy:
- clip.art sends `{ subject, style, content_type }` to ESY's API
- ESY runs the full pipeline and returns `{ image_url, title, slug, description, category }`
- clip.art inserts the result into its own `generations` table for display

clip.art no longer needs direct AI provider API keys, R2 credentials in its own env, or any generation/processing logic. It becomes a pure consumer of ESY's output.

### The Two Interfaces

**ESY Dashboard** — The control plane. This is where you:
- Configure and launch batches
- Monitor running jobs (progress, cost, failures)
- Review flagged images in the HITL queue
- Set up recurring schedules with budget caps
- View cost reports and generation history

**ESY API** — The execution plane. This is what clip.art calls to:
- Request single generations (user-initiated)
- Submit batch jobs programmatically
- Poll job status
- Retrieve completed assets

The dashboard is the primary product. It's designed around the daily workflow of operating clip.art. The API is what makes it work — every dashboard action maps to an API call, and clip.art's production traffic flows through the same API.

---

## Part 2: Product Scope

### What ESY Does

ESY automates the process of producing high-quality, above-threshold artifacts for an end user. The scope is:

1. **Define** — What to generate (subjects, styles, content types, quantities)
2. **Generate** — Execute against AI providers with routing, retries, and cost optimization
3. **Process** — Convert, compress, and store the artifact (WEBP, R2)
4. **Classify** — Enrich with metadata (title, description, category, slug, tags)
5. **Score** — Automated quality checks (background, isolation, resolution, safety)
6. **Review** — HITL queue for images that need human approval
7. **Deliver** — Make approved assets available to the consuming application

### What ESY Does NOT Do

- Track how artifacts perform after delivery (sales, clicks, engagement)
- Integrate with third-party marketplaces (Etsy, Shopify, Amazon)
- Provide analytics about downstream usage
- Make decisions about how artifacts are displayed or monetized

ESY's job ends when a quality-approved artifact is delivered. What happens after that is the consuming application's domain.

---

## Part 3: Known Pipeline Issues

These are the problems identified in the current clip.art generation scripts that ESY must solve. Each represents a requirement for the ESY platform.

### 1. Slug Collision Risk
Current random 6-char suffix has non-trivial collision probability at scale. No retry-on-conflict logic. ESY needs deterministic, collision-free slug generation with conflict resolution.

### 2. Descriptions Bypass Classification
Batch scripts hardcode thin, templated descriptions (`"Free {animal} clip art in {style} style"`). The classify pipeline produces rich 150-300 char descriptions but isn't called during batch generation. ESY must run classification on every generated image.

### 3. Formulaic Titles
Every title follows `"{Animal} {Style} Clip Art"`. Different poses of the same animal in the same style get identical titles. ESY must generate unique, descriptive titles per image.

### 4. No Image Quality Verification
Zero post-generation checks: no white background verification, no isolation check, no visual similarity detection, no resolution/corruption check, no secondary safety pass. ESY must implement automated quality scoring.

### 5. No Retry or Dead-Letter Queue
Failed generations are logged to console and lost. No persistent failure records, no retry mechanism, no failure categorization (rate limit vs safety filter vs network). ESY must track every job attempt with status and error classification.

### 6. No Cost Tracking or Budget Controls
No per-run cost calculation, no daily spend cap, no cost-per-image logging. ESY must track cost per generation and enforce configurable budget limits.

### 7. Prompt Diversity Ceiling
22 variations x 11 styles = 242 templates. Deterministic assignment means re-runs pick the same combos. ESY must track which prompt/style/variation combos have been used per subject and generate novel combinations.

### 8. No Asset Type Generalization
Script is hardcoded for clip art. Coloring pages need different prompt templates, aspect ratios, R2 paths, and DB fields. Illustrations differ again. Animations are a completely different pipeline. ESY must be content-type-agnostic with per-type configuration.

### 9. No Scheduling or Orchestration
Manual CLI invocation only. No cron, no idempotency, no run isolation, no checkpoint/resume. ESY must provide scheduled, resumable, isolated batch execution.

### 10. No HITL Workflow
Images go straight to `is_public: true`. No staging state, no review queue, no approval flow, no rejection feedback loop, no quality scoring. ESY must implement a full review pipeline with staging → review → approve/reject → publish flow.

### 11. R2 Orphan Management
If Supabase insert fails after R2 upload, the image is orphaned in storage. ESY must ensure atomic operations or implement cleanup for orphaned assets.

### 12. Hardcoded Category Assignment
Script hardcodes `animals-that-start-with-{letter}`. Non-animal categories need dynamic resolution. ESY must use the classification pipeline for all category assignment.

### 13. No Provenance or Batch Tracking
No `batch_id`, `run_id`, or `generated_by` field. Can't answer "which batch produced this image?" or "what was the failure rate last week?" ESY must tag every generation with full provenance metadata.

### 14. Sitemap Explosion
Current query limits sitemap to 5,000 entries. At 1,000 images/day, this overflows within a week. Needs sitemap index splitting. (This is a clip.art concern, not ESY's, but ESY's output rate drives it.)

### 15. Search Vector Gap
Batch-generated images don't populate the `search_vector` column. They won't appear in full-text search. ESY must ensure all metadata fields needed for downstream indexing are populated.

### 16. No Variation Tracking
No record of which pose/style/variation combos have been generated for a given subject. Can't ensure even distribution or fill gaps. ESY must maintain a variation matrix per subject.

---

## Part 4: Supported Asset Types

ESY must handle all content types clip.art produces. Each type has different pipeline requirements.

| Asset Type | Prompt Template | Aspect Ratio | R2 Path Prefix | DB Table | DB `content_type` |
|---|---|---|---|---|---|
| Clip art | Isolated object, white background | 1:1 | `{category}/` | `generations` | `clipart` |
| Coloring pages | Line art, black outlines, no fills, no color | 3:4 | `coloring-pages/{theme}/` | `generations` | `coloring` |
| Illustrations | Full scene with background, environment, lighting | 4:3 | `illustrations/{category}/` | `generations` | `illustration` |
| Animations | Video from source image (Kling/fal.ai) | N/A | Separate video storage | `animations` | N/A |
| Stickers | Similar to clip art, thick outline, die-cut feel | 1:1 | TBD | `generations` | TBD |

### Content Type Templates (from `src/lib/styles.ts`)
```
clipart:      "clip art, isolated object on plain white background"
illustration: "illustration, full scene with detailed background, environment, and lighting"
coloring:     "coloring book page, printable line art, black outlines only, no fills, no shading, no color, no gradients, white background"
```

### Available Clip Art Styles
flat, cartoon, watercolor, vintage, 3d, doodle, kawaii, outline, sticker, chibi, pixel

### Animation Pipeline (Different from Image Generation)
Animations use a completely separate pipeline:
- Source: an existing generated image (`source_generation_id`)
- Provider: Kling via fal.ai (not Gemini/OpenAI)
- Output: video file, not image
- DB: `animations` table with status tracking (`processing` → `completed`/`failed`)
- Additional fields: `duration`, `generate_audio`, `fal_request_id`, `video_url`, `preview_url`, `thumbnail_url`, `last_frame_url`

ESY must treat animations as a first-class pipeline alongside image generation, not an afterthought.

---

## Part 5: Current Pipeline Implementation (Pre-ESY)

This documents what exists today in clip.art's codebase. ESY will replace these components.

### Pipeline 1: Clip Art Batch Generation

**Script:** `scripts/seed-animal-clipart.ts`

**Trigger:** Manual — `npx tsx scripts/seed-animal-clipart.ts`

**AI Providers (50/50 split):**
| Provider | Model | Quality | Size | Cost/image |
|----------|-------|---------|------|-----------|
| Google Gemini | `gemini-2.5-flash-image` | default | 1:1 | ~$0.02 |
| OpenAI | `chatgpt-image-latest` | medium | 1024x1024 | ~$0.04 |

**Concurrency:** Gemini 5 workers, OpenAI 3 workers, both pools in parallel.

**Prompt Construction:**
```
{VARIATION(animal)} . {STYLE_DESCRIPTOR} . clip art, isolated object on plain white background
```
- 22 pose/action templates
- 11 art styles
- Deterministic assignment based on array index

**Post-Processing:**
1. Raw buffer → sharp → WEBP (quality 85, effort 4)
2. Upload to R2: `{category-slug}/{animal-slug}-{style}-{random6}.webp`
3. Insert into `generations` table

**Skip Logic:** Checks existing slugs (minus random suffix) to avoid regenerating existing combos.

**Error Handling:** Log and count. No persistence, no retry.

### Pipeline 2: User-Initiated Generation

**Route:** `app/api/generate/route.ts`

**Flow:**
1. User submits prompt + style + content_type
2. Prompt safety check (`src/lib/promptSafety.ts`)
3. Image generation via Gemini (`src/lib/imageGen.ts`) or OpenAI (`src/lib/gptImage1.ts`, `src/lib/gptImage2.ts`)
4. WEBP conversion via sharp
5. R2 upload with content-type-aware key (`resolveR2Key`)
6. Auto-classification via `classifyPrompt()` — title, description, category, slug
7. Insert into `generations` table
8. Deduct user credits

### Pipeline 3: Auto-Classification

**Module:** `src/lib/classify.ts` — `classifyPrompt()`

**Output:**
| Field | Spec |
|-------|------|
| `title` | 3-8 words, max 60 chars, properly capitalized |
| `category` | Best-matching slug from active DB categories |
| `description` | 2-3 sentences, 150-300 chars, unique per image |
| `slug` | URL-friendly, max 40 chars |

**Fallback:** `cleanTitleFromPrompt()` heuristic + default category on failure.

### Pipeline 4: Category SEO Content Generation

**Module:** `src/lib/classify.ts` — `generateCategorySEO()`

**Output:** h1, meta_title, meta_description, intro, seo_content (paragraphs), suggested_prompts.

---

## Part 6: ESY Interface Specification

### Batch Job

```typescript
interface BatchJob {
  id: string;
  type: "clipart" | "coloring" | "illustration" | "animation";
  status: "queued" | "running" | "completed" | "failed" | "paused";

  // What to generate
  subject_source: "animal_entries" | "category_seed" | "custom_list";
  subjects: string[];
  styles: string[];
  images_per_subject: number;

  // How to generate
  providers: ProviderConfig[];
  concurrency: { gemini: number; openai: number };

  // Scheduling
  scheduled_at?: string;
  daily_limit?: number;

  // Provenance
  batch_id: string;
  run_id: string;
  created_by: string;

  // Results
  total_planned: number;
  total_completed: number;
  total_failed: number;
  cost_estimate_usd: number;
  cost_actual_usd: number;
}

interface ProviderConfig {
  name: "gemini" | "openai";
  model: string;
  quality: "low" | "medium" | "high";
  weight: number;
}
```

### Quality Control

```typescript
interface QualityCheck {
  id: string;
  generation_id: string;

  // Automated checks
  has_white_background: boolean;
  is_isolated_object: boolean;
  resolution_ok: boolean;
  file_size_ok: boolean;
  safety_passed: boolean;

  // AI-assisted checks
  matches_prompt: boolean;
  quality_score: number;            // 0-100

  // Human review
  human_approved?: boolean;
  reviewer_notes?: string;

  // Outcome
  status: "auto_approved" | "needs_review" | "rejected";
}
```

### Scheduling

```typescript
interface Schedule {
  id: string;
  name: string;
  cron: string;
  batch_template: Partial<BatchJob>;
  enabled: boolean;

  // Safeguards
  max_daily_images: number;
  max_daily_cost_usd: number;
  pause_on_failure_rate: number;    // e.g. 0.1 = pause if >10% fail
}
```

### Variation Tracking

```typescript
interface VariationRecord {
  subject: string;
  style: string;
  variation: string;               // pose/action description
  generation_id: string;
  batch_id: string;
  created_at: string;
}
```

---

## Part 7: Cost Reference

| Provider | Model | Quality | Size | Cost/image |
|----------|-------|---------|------|-----------|
| Gemini | gemini-2.5-flash-image | default | 1:1 | ~$0.02 |
| OpenAI | chatgpt-image-latest | medium | 1024x1024 | ~$0.04 |
| OpenAI | chatgpt-image-latest | high | 1024x1024 | ~$0.08 |

**Budget formula:** `1000 images/day x $0.04 avg = ~$40/day = ~$1,200/month`

### Recommended Daily Cadence
1. **6:00 AM** — Scheduled batch kicks off
2. **6:00-8:00 AM** — Generation runs (1000 images @ ~7 imgs/min)
3. **8:00 AM** — Automated QC pipeline runs
4. **8:30 AM** — Flagged images queued for human review
5. **9:00 AM** — Approved images go public, cache revalidated

### Scaling Considerations
- Google indexes 100-200 new pages/day comfortably for new sites
- After domain authority builds (3-6 months), scale to 500-1000/day
- Don't exceed 5,000 new pages/day — risks "thin content" penalty
- Each generated image creates one new detail page on clip.art
- Depth-first strategy: saturate one category before moving to next

---

## Part 8: Environment Variables (Current Pre-ESY Setup)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# AI Providers
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=          # default: gemini-2.5-flash-image
OPENAI_API_KEY=
```

Post-ESY migration, clip.art only needs `ESY_API_KEY` and `ESY_API_URL`. All provider keys, R2 credentials, and processing config move to ESY.

---

## Part 9: File Reference (Current clip.art Codebase)

| File | Purpose | ESY Replaces? |
|------|---------|---------------|
| `scripts/seed-animal-clipart.ts` | Batch clip art generation | Yes — ESY batch API |
| `src/lib/imageGen.ts` | Gemini image generation | Yes — ESY generation engine |
| `src/lib/gptImage1.ts` | OpenAI gpt-image-1 integration | Yes — ESY generation engine |
| `src/lib/gptImage2.ts` | OpenAI gpt-image-2 (ChatGPT Images 2.0) integration | Yes — ESY generation engine |
| `src/lib/r2.ts` | R2 upload utilities | Yes — ESY storage layer |
| `src/lib/classify.ts` | Auto-classification and SEO gen | Yes — ESY metadata enrichment |
| `src/lib/promptSafety.ts` | Prompt safety filtering | Yes — ESY safety layer |
| `src/lib/styles.ts` | Style descriptors and templates | Shared config — ESY uses same definitions |
| `src/lib/seo-jsonld.ts` | JSON-LD structured data | No — clip.art SEO concern |
| `app/api/generate/route.ts` | User generation endpoint | Becomes thin proxy to ESY API |
| `db/add-animal-entries.sql` | animal_entries table | Stays in clip.art (domain data) |
| `db/seed-animal-entries.sql` | Animal seed data | Stays in clip.art (domain data) |
| `db/add-animal-alphabet-seo-pages.sql` | 26 letter category pages | Stays in clip.art (SEO pages) |
