# Esy Template Runner API — Design Document

**Status**: Design Phase
**Date**: April 4, 2026
**Author**: ESY LLC
**Context**: Designing the `api.esy.com` template runner around clip.art's worksheet use case as the first business-driven template type.

---

## 1. Overview

### What Esy Does

Esy is a template-to-artifact engine. The core loop:

```
Template (structure, rules, quality checks)
   +
Input (assets, text, parameters)
   =
Artifact (structured, reliable, exportable output)
```

Today Esy produces research artifacts (essays, visual essays, infographics) from source materials. The template runner API (`api.esy.com`) generalizes this into a programmable service that any product — starting with clip.art — can call to produce artifacts.

### What clip.art Needs

Teachers on clip.art generate custom clip art and want to produce **printable worksheets** (matching, labeling, tracing, fill-in-the-blank, word search, etc.) using their generated images. clip.art does not want to build a template engine, renderer, or PDF exporter — it wants to call an API with structured inputs and receive a finished artifact.

### The Relationship

```
clip.art (consumer)                     Esy (provider)
─────────────────                       ────────────────
User generates 6 images                 
User selects "Matching Worksheet"       
clip.art collects inputs                
clip.art calls api.esy.com/v1/run  ──►  Esy runs template
                                        Esy renders layout
                                        Esy exports PDF
clip.art receives artifact URL     ◄──  Returns artifact
clip.art serves PDF to user             
```

---

## 2. Design Decisions

Each decision below is framed by the worksheet use case but should generalize to all future Esy template types.

### Decision 1: Asset Ownership — Who Provides the Assets?

**The question**: Esy essays generate all content from sources. Worksheets need pre-made images from clip.art. Does the API accept external assets, or does Esy always generate its own?

**Options**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Caller provides assets** | clip.art sends image URLs as input | Clean separation, Esy is stateless about image generation | Caller must generate assets first |
| **B. Esy generates assets** | Esy calls an image generation service internally | Esy is self-contained | Tight coupling, Esy needs image generation capability |
| **C. Both** | API accepts pre-made assets OR generates them via a configured provider | Maximum flexibility | More complex API surface |

**Recommendation**: **C (both)** — The API should accept asset URLs when the caller provides them (clip.art's case) and optionally generate assets when given prompts instead of URLs (Esy.com's native case). The template schema defines which input slots accept URLs, prompts, or both.

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` Other: _______________

---

### Decision 2: Sync vs Async Execution

**The question**: Essays take 15-30 minutes. A worksheet with pre-made images should take seconds. Does the API always use a queue, or can it return artifacts synchronously?

**Options**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Always async** | Every run returns a job ID, caller polls or receives webhook | Uniform API, handles any template duration | Overkill for fast templates, worse UX |
| **B. Always sync** | API blocks until artifact is ready | Simple for callers | Timeouts on long-running templates |
| **C. Template-defined** | Template declares its execution mode; fast templates return sync, slow ones return a job | Best UX per template type | Two response shapes to handle |
| **D. Caller chooses** | Request param `mode: "sync" | "async"` | Caller controls their UX | Template might not support sync if it's inherently slow |

**Recommendation**: **D (caller chooses)** with a template-defined maximum sync timeout. If the caller requests sync but the template can't finish in time, it falls back to async and returns a job ID. This lets clip.art get instant PDFs for worksheets while Esy.com can use async for essays.

```
POST api.esy.com/v1/run
{
  "template": "worksheet-matching",
  "mode": "sync",          // or "async"
  "webhook": null,         // required if async
  "inputs": { ... }
}

// Sync response (fast template):
{ "artifact": { "url": "https://...", "format": "pdf", "pages": 2 } }

// Async response (slow template or sync timeout):
{ "jobId": "abc-123", "status": "processing", "estimatedSeconds": 900 }
```

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` D / `[ ]` Other: _______________

---

### Decision 3: Artifact Format

**The question**: Essays are web pages (HTML). Worksheets must be printable PDFs with fixed page sizes. Does the template define the output format, or does the caller choose?

**Options**:

| Option | Description |
|--------|-------------|
| **A. Template-defined** | Each template declares its output format(s) — e.g., "matching-worksheet" always produces PDF |
| **B. Caller-defined** | Caller requests `format: "pdf"` or `format: "html"` and the renderer adapts |
| **C. Template declares supported formats, caller picks** | Template says "I support pdf and png", caller picks which one |

**Recommendation**: **C** — Templates declare what they can produce. A worksheet template supports `pdf`. An essay template supports `html` and `pdf`. The caller picks from available options.

```json
// Template definition
{
  "id": "worksheet-matching",
  "formats": ["pdf"],
  "pageSize": "letter",
  "orientation": "portrait"
}

// API request
{
  "template": "worksheet-matching",
  "format": "pdf",
  "inputs": { ... }
}
```

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` Other: _______________

---

### Decision 4: Input Specificity — How Much Does the Template Control?

**The question**: When clip.art calls the API, how much control does the caller have over layout vs. how much does the template dictate?

**Options**:

| Option | Description | Example |
|--------|-------------|---------|
| **A. Raw data** | Caller sends unstructured inputs, template decides everything | `{ "images": [...], "labels": [...] }` |
| **B. Slot-based** | Template defines named slots, caller fills them explicitly | `{ "slot_1_image": "url", "slot_1_label": "Whale" }` |
| **C. Intent-based** | Caller describes what they want, Esy figures out the rest | `{ "topic": "ocean animals", "count": 6, "grade": "K" }` |
| **D. Tiered** | Support all three — intent auto-fills slots, caller can override any slot | Intent generates defaults, caller overrides specific slots |

**Recommendation**: **D (tiered)** — This maps to the two user flows on clip.art:

1. **"Generate a worksheet for me"** — teacher describes intent, Esy + clip.art handle everything (intent-based, auto-fills all slots)
2. **"I have my images, make a worksheet"** — teacher has already generated images, just wants assembly (slot-based, caller fills everything)

The API accepts both and merges them: intent fills defaults, explicit slot values override.

```json
// Intent-based (Esy fills everything):
{
  "template": "worksheet-matching",
  "intent": {
    "topic": "ocean animals",
    "grade": "K",
    "count": 6
  }
}

// Slot-based (caller fills everything):
{
  "template": "worksheet-matching",
  "inputs": {
    "title": "Ocean Animals Matching",
    "instructions": "Draw a line from each animal to its name.",
    "items": [
      { "image": "https://clip.art/cdn/abc.png", "label": "Sea Turtle" },
      { "image": "https://clip.art/cdn/def.png", "label": "Dolphin" }
    ]
  }
}

// Hybrid (intent + overrides):
{
  "template": "worksheet-matching",
  "intent": { "topic": "ocean animals", "grade": "K", "count": 6 },
  "inputs": {
    "title": "My Custom Title"
  }
}
```

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` D / `[ ]` Other: _______________

---

### Decision 5: Bidirectional API — Does Esy Call clip.art?

**The question**: When a user on Esy.com (not clip.art) creates a worksheet, Esy needs images. Does Esy call clip.art's API to generate them?

**Options**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Esy calls clip.art** | Esy has a service integration with clip.art's generation API | Single source of truth for image generation, consistent quality | Bidirectional dependency, clip.art must expose an API |
| **B. Esy has its own generation** | Esy integrates directly with OpenAI GPT Image / Gemini / etc. | Independent, no dependency on clip.art | Duplicate capability, potentially different quality/style |
| **C. Pluggable providers** | Template defines an "image provider" — could be clip.art, could be a direct model provider, could be user-uploaded | Maximum flexibility, no hard dependency | More complex configuration |

**Recommendation**: **C (pluggable)** with clip.art as the default provider for education templates. This keeps Esy independent while giving clip.art a privileged position. Future templates (e.g., business presentations) could use different image providers.

```json
// Template definition
{
  "id": "worksheet-matching",
  "assetProviders": {
    "image": {
      "default": "clipart",
      "supported": ["clipart", "upload", "gpt-image"]
    }
  }
}
```

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` Other: _______________

---

## 3. Reference Implementation: Matching Worksheet

This section walks through the full lifecycle using the worksheet as a concrete example.

### 3.1 Template Definition

```json
{
  "id": "worksheet-matching",
  "name": "Matching Worksheet",
  "version": "1.0",
  "category": "education/worksheet",
  "description": "Two-column matching exercise with images and labels",
  "formats": ["pdf"],
  "pageSize": "letter",
  "orientation": "portrait",
  "executionMode": {
    "syncMaxSeconds": 30,
    "estimatedSeconds": 5
  },
  "assetProviders": {
    "image": { "default": "clipart", "supported": ["clipart", "upload"] }
  },
  "schema": {
    "intent": {
      "topic": { "type": "string", "required": true, "description": "Subject matter" },
      "grade": { "type": "string", "enum": ["Pre-K", "K", "1", "2", "3", "4", "5"], "default": "K" },
      "count": { "type": "integer", "min": 3, "max": 12, "default": 6 }
    },
    "inputs": {
      "title": { "type": "string", "maxLength": 100 },
      "instructions": { "type": "string", "maxLength": 300 },
      "items": {
        "type": "array",
        "minItems": 3,
        "maxItems": 12,
        "items": {
          "image": { "type": "url", "accept": ["image/png", "image/jpeg", "image/webp"] },
          "label": { "type": "string", "maxLength": 50 }
        }
      },
      "includeAnswerKey": { "type": "boolean", "default": true },
      "shuffleLabels": { "type": "boolean", "default": true }
    }
  }
}
```

### 3.2 clip.art Flow (Slot-Based — User Has Images)

```
Teacher on clip.art:
  1. Generates 6 ocean animal images using /create
  2. Clicks "Make Worksheet" → worksheet type picker
  3. Selects "Matching" → input form pre-filled with their images
  4. Adds labels, adjusts title
  5. Clicks "Generate Worksheet"

clip.art backend:
  POST api.esy.com/v1/run
  {
    "template": "worksheet-matching",
    "mode": "sync",
    "format": "pdf",
    "apiKey": "clipart_sk_...",
    "inputs": {
      "title": "Ocean Animals Matching",
      "instructions": "Draw a line from each animal to its name.",
      "items": [
        { "image": "https://cdn.clip.art/gen/abc.png", "label": "Sea Turtle" },
        { "image": "https://cdn.clip.art/gen/def.png", "label": "Dolphin" },
        { "image": "https://cdn.clip.art/gen/ghi.png", "label": "Octopus" },
        { "image": "https://cdn.clip.art/gen/jkl.png", "label": "Clownfish" },
        { "image": "https://cdn.clip.art/gen/mno.png", "label": "Whale" },
        { "image": "https://cdn.clip.art/gen/pqr.png", "label": "Jellyfish" }
      ],
      "includeAnswerKey": true,
      "shuffleLabels": true
    }
  }

Esy returns:
  {
    "artifact": {
      "id": "art_xyz789",
      "url": "https://cdn.esy.com/artifacts/art_xyz789.pdf",
      "format": "pdf",
      "pages": 2,
      "expiresAt": "2026-04-05T00:00:00Z"
    }
  }

clip.art serves the PDF download to the teacher.
```

### 3.3 clip.art Flow (Intent-Based — AI Does Everything)

```
Teacher on clip.art:
  1. Clicks "Make Worksheet"
  2. Types "ocean animals matching worksheet for kindergarten"
  3. Clicks "Generate"

clip.art backend:
  POST api.esy.com/v1/run
  {
    "template": "worksheet-matching",
    "mode": "async",
    "format": "pdf",
    "apiKey": "clipart_sk_...",
    "intent": {
      "topic": "ocean animals",
      "grade": "K",
      "count": 6
    },
    "assetProvider": {
      "image": "clipart",
      "config": {
        "apiKey": "esy_internal_clipart_key",
        "style": "kawaii",
        "background": "transparent"
      }
    },
    "webhook": "https://clip.art/api/webhooks/esy"
  }

Esy processes:
  1. LLM generates 6 items: [{ prompt: "cute cartoon sea turtle...", label: "Sea Turtle" }, ...]
  2. Esy calls clip.art's generation API for each image prompt
  3. Esy assembles images + labels into the matching template
  4. Esy renders PDF
  5. Esy calls webhook with artifact URL

clip.art webhook receives:
  {
    "jobId": "job_abc123",
    "status": "completed",
    "artifact": {
      "id": "art_xyz789",
      "url": "https://cdn.esy.com/artifacts/art_xyz789.pdf",
      "format": "pdf",
      "pages": 2
    }
  }
```

---

## 4. Authentication

Esy API uses **API key authentication** for service-to-service calls:

```
POST api.esy.com/v1/run
Authorization: Bearer clipart_sk_...
```

- clip.art has an API key issued by Esy
- Keys are scoped to allowed templates and rate limits
- Esy tracks usage per key for billing/quotas

This is separate from Esy.com's user auth (teachers logging into app.esy.com). The API serves both:
- **Service callers** (clip.art backend → API key)
- **Direct users** (app.esy.com frontend → user session)

---

## 5. Billing Model

> **OPEN QUESTION**: How does clip.art pay for Esy template runs?

**Options**:

| Option | Description |
|--------|-------------|
| **A. Internal transfer** | Both are ESY LLC — no billing, shared cost center |
| **B. Credit pool** | clip.art buys Esy API credits in bulk, each run deducts from the pool |
| **C. Per-run pricing** | Esy charges per template execution (e.g., $0.05/worksheet) |
| **D. Bundled into clip.art credits** | clip.art charges the teacher credits, eats the Esy cost |

> **DECISION**: `[ ]` A / `[ ]` B / `[ ]` C / `[ ]` D / `[ ]` Other: _______________

---

## 6. Template Registry API

Beyond running templates, clip.art needs to **discover** available templates to build its UI:

```
GET api.esy.com/v1/templates
Authorization: Bearer clipart_sk_...

Response:
{
  "templates": [
    {
      "id": "worksheet-matching",
      "name": "Matching Worksheet",
      "category": "education/worksheet",
      "description": "Two-column matching exercise with images and labels",
      "formats": ["pdf"],
      "schema": { ... },
      "thumbnail": "https://cdn.esy.com/templates/matching-thumb.png"
    },
    {
      "id": "worksheet-labeling",
      "name": "Labeling Worksheet",
      ...
    }
  ]
}
```

This lets clip.art dynamically build its worksheet picker UI from whatever templates Esy has available — no clip.art deploy needed when Esy adds a new template type.

---

## 7. Initial Template Roadmap

Templates to build for the clip.art worksheet use case:

| Template | Description | Complexity | Priority |
|----------|-------------|------------|----------|
| `worksheet-matching` | Two-column image-to-label matching | Low | P0 — reference implementation |
| `worksheet-labeling` | Image with blank labels pointing to parts | Medium | P1 |
| `worksheet-fill-blank` | Sentences with blanks, images as context | Low | P1 |
| `worksheet-tracing` | Dotted outlines of images/letters for tracing | Medium | P2 |
| `worksheet-word-search` | Word search grid with image clues | Medium | P2 |
| `worksheet-color-by-number` | Coloring page regions with number-color key | High | P3 |
| `flashcard-set` | Printable flashcards (image front, text back) | Low | P1 |
| `poster-vocabulary` | Classroom poster with images and vocabulary | Low | P2 |

---

## 8. What clip.art Needs to Build

Once `api.esy.com/v1/run` is operational, clip.art's integration is thin:

| Component | Description | Effort |
|-----------|-------------|--------|
| `/worksheets` page | Template picker UI (fetches from Esy registry) | 1-2 days |
| Template input form | Dynamic form built from template schema | 2-3 days |
| Image selector | Pick from existing generations to fill image slots | 1 day (reuse ImageImportModal) |
| API route | `/api/worksheets/run` — proxies to `api.esy.com` with clip.art's API key | 1 day |
| Artifact delivery | Download link / preview for the returned PDF | 1 day |
| Sidebar nav | "Worksheets" link in AppSidebar | Trivial |

**Total clip.art effort**: ~1 week once the Esy API is live.

---

## 9. Open Questions

- [ ] **Decision 1**: Asset ownership — A / B / C?
- [ ] **Decision 2**: Sync vs async — A / B / C / D?
- [ ] **Decision 3**: Artifact format — A / B / C?
- [ ] **Decision 4**: Input specificity — A / B / C / D?
- [ ] **Decision 5**: Bidirectional API — A / B / C?
- [ ] **Billing model**: Internal transfer / credit pool / per-run / bundled?
- [ ] **Artifact storage**: Who hosts the generated PDFs? Esy CDN with expiring URLs? Or clip.art downloads and stores in R2?
- [ ] **Error handling**: What happens when a template run fails mid-execution? (e.g., one of 6 image generations fails)
- [ ] **Versioning**: When a template is updated, do existing artifacts regenerate or stay frozen?
- [ ] **Rate limits**: What are clip.art's initial quotas?
