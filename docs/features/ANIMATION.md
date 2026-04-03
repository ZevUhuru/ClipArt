# Animation Feature — Kling AI via Fal.ai

**Shipped:** April 2026
**Status:** Live

Animate any generated clip art into a 5–15 second MP4 video using Kling AI (2.5 Turbo, 3.0 Standard, 3.0 Pro) through the Fal.ai platform. Users describe motion in natural language, select a quality tier, choose their preferred duration (5–15 seconds), and optionally enable native AI audio. Downloadable video is ready in ~1–3 minutes depending on length.

---

## Table of Contents

1. [Integration Decision](#integration-decision-falai-not-direct-kling)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Credit Pricing](#credit-pricing)
5. [Video Assets Strategy](#video-assets-strategy)
6. [Video Format Decision](#video-format-decision-mp4-not-webm)
7. [Storage Decision](#storage-decision-r2-not-muxcloudflare-stream)
8. [Fal.ai Integration](#falai-integration)
9. [API Endpoints](#api-endpoints)
10. [Video Post-Processing](#video-post-processing)
11. [Frontend](#frontend)
12. [Components](#components)
13. [Mixed Grid: Animated Cards](#mixed-grid-animated-cards)
14. [Navigation](#navigation)
15. [SEO Video Strategy](#seo-video-strategy)
16. [Files](#files)
17. [Environment Variables](#environment-variables)
18. [Database Migration](#database-migration)
19. [Expansion Roadmap](#expansion-roadmap)

---

## Integration Decision: Fal.ai (not direct Kling)

We evaluated two integration paths for Kling AI video generation:

### Fal.ai (chosen)

- **Next.js SDK**: `@fal-ai/client` and `@fal-ai/server-proxy` with dedicated Next.js route handler that keeps API keys server-side
- **Async queue management**: Built-in `fal.queue.submit()`, `fal.queue.status()`, and `fal.queue.result()` — no custom queue infrastructure needed
- **Pay-as-you-go**: No minimums, no contracts, no monthly commitment
- **Unified API**: Single integration pattern across Kling 2.5 Turbo, 3.0 Standard, and 3.0 Pro
- **Transparent pricing**: Per-request billing, no opaque tier structure

### Direct Kling API (rejected)

- **Minimum commitment**: $1,400+/month or third-party reseller with markup
- **No native Next.js SDK**: Requires building custom HTTP client, queue polling, error handling
- **Contract required**: Enterprise agreement for production access
- **Separate SDKs per version**: Different API shapes for 2.5 vs 3.0

### Conclusion

Fal.ai eliminates infrastructure complexity and allows us to launch with zero monthly commitment. The cost premium over direct Kling is offset by development time savings and operational simplicity. We can migrate to direct Kling later if volume justifies the investment.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend                                                         │
│                                                                   │
│  Drawer/Detail "Animate" btn ──► /animate?id={generation_id}     │
│  Sidebar "Animate" link ────────► /animate (image picker)         │
│  Animate Page ──────────────────► POST /api/animate               │
│                 ◄── poll 5s ────► GET /api/animate/status?id=     │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  POST /api/animate                                                │
│                                                                   │
│  1. Validate prompt (length ≤ 1000, safety filter)               │
│  2. Validate source URL (must be images.clip.art)                │
│  3. Auth required — check user session                           │
│  4. Credit check — deduct based on model tier                    │
│  5. Lookup source generation for category/slug metadata          │
│  6. Submit to Fal.ai queue → receive request_id                  │
│  7. Insert animations row (status: processing)                   │
│  8. Return { animationId, status, creditsRemaining }             │
└──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  Fal.ai Proxy (app/api/fal/proxy/[...path]/route.ts)            │
│                                                                   │
│  Server-side proxy using @fal-ai/server-proxy/nextjs              │
│  Keeps FAL_KEY secret, restricts to fal-ai/kling-video/**        │
└──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  Fal.ai Queue                                                     │
│                                                                   │
│  Kling 2.5 Turbo: fal-ai/kling-video/v2.5-turbo/pro/i2v         │
│  Kling 3.0 Std:   fal-ai/kling-video/v3/standard/i2v            │
│  Kling 3.0 Pro:   fal-ai/kling-video/v3/pro/i2v                 │
│                                                                   │
│  Processing time: 60–180 seconds                                  │
│  Returns: temporary video URL                                     │
└──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  GET /api/animate/status                                          │
│                                                                   │
│  On Fal.ai COMPLETED:                                             │
│  1. Download video from Fal.ai temp URL                          │
│  2. Fetch source image → generate WebP thumbnail via Sharp       │
│  3. Upload full MP4 + thumbnail to R2                            │
│  4. Update animations row (status: completed, URLs)              │
│                                                                   │
│  On Fal.ai FAILED:                                                │
│  1. Update row (status: failed)                                  │
│  2. Refund credits to user profile                               │
│  3. Update row (status: refunded)                                │
└──────────────────────────────────────────────────────────────────┘
```

### Request flow

1. User selects an image and describes the desired motion
2. Frontend POSTs to `/api/animate` with `sourceUrl`, `prompt`, `model`, `duration`, `audio`
3. Backend validates, deducts credits, submits to Fal.ai queue, inserts DB row
4. Frontend polls `/api/animate/status?id={animationId}` every 5 seconds
5. When Fal.ai completes, status endpoint downloads video, generates thumbnail, uploads to R2
6. Frontend receives completed status with video URL, displays the result

---

## Data Model

Animations live in a separate `animations` table, not in `generations`. Rationale:

- **Different media type**: Video vs image — different storage, processing, and display logic
- **Different lifecycle**: Async queue (1–2 min) vs synchronous generation (~5s)
- **Different cost structure**: 5–54 credits vs 1 credit (varies by model, duration, and audio)
- **Clean separation**: No nullable columns polluting the generations table

### Schema

```sql
CREATE TABLE IF NOT EXISTS public.animations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_generation_id uuid REFERENCES public.generations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  model text NOT NULL DEFAULT 'kling-3.0-standard',
  duration integer NOT NULL DEFAULT 5,
  generate_audio boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'processing',
  fal_request_id text,
  video_url text,
  preview_url text,
  thumbnail_url text,
  credits_charged integer NOT NULL DEFAULT 5,
  error_message text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed', 'refunded'))
);
```

### Indexes

```sql
CREATE INDEX idx_animations_user_id ON public.animations(user_id);
CREATE INDEX idx_animations_status ON public.animations(status) WHERE status = 'processing';
CREATE INDEX idx_animations_source ON public.animations(source_generation_id)
  WHERE source_generation_id IS NOT NULL;
```

### Column details

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key, auto-generated |
| `user_id` | uuid | Owner, cascading delete when user is removed |
| `source_generation_id` | uuid | Links to the source clip art image in `generations` |
| `prompt` | text | The natural language motion description |
| `model` | text | One of: `kling-2.5-turbo`, `kling-3.0-standard`, `kling-3.0-pro` |
| `duration` | integer | Video length in seconds (5–15, default 5; max 10 for Kling 2.5) |
| `generate_audio` | boolean | Native AI audio generation (sound effects + voice; Kling 3.0 only) |
| `status` | text | Lifecycle state: `processing` → `completed` or `failed` → `refunded` |
| `fal_request_id` | text | Fal.ai queue request ID, used for status polling |
| `video_url` | text | Full-quality MP4 URL in R2 (set on completion) |
| `preview_url` | text | Preview MP4 URL for grid autoplay (same as full at launch) |
| `thumbnail_url` | text | WebP poster frame URL (generated from source image) |
| `credits_charged` | integer | Credits deducted at submission time |
| `error_message` | text | Error details when `status = 'failed'` |
| `is_public` | boolean | Whether this animation appears in public grids (default true) |
| `created_at` | timestamptz | Submission timestamp |
| `completed_at` | timestamptz | Completion timestamp (null while processing) |

**Migration file:** `db/add-animations.sql`

---

## Credit Pricing

### Per-second credit model

Animation credits scale linearly with duration. Each model has a base credit rate per second. Enabling native audio adds a 50% surcharge (matching fal.ai's ~50% audio markup on their per-second pricing).

**Base rates (credits per second):**

| Model | Credits/sec (silent) | Credits/sec (audio) |
|-------|---------------------|---------------------|
| Kling 2.5 Fast | 1.0 | N/A (no audio support) |
| Kling 3.0 Standard | 1.6 | 2.4 |
| Kling 3.0 Pro | 2.4 | 3.6 |

**Formula:** `credits = round(base_per_sec * duration * (audio ? 1.5 : 1.0))`

### Full credit matrix

| Model | 5s silent | 5s audio | 10s silent | 10s audio | 15s silent | 15s audio |
|-------|-----------|----------|------------|-----------|------------|-----------|
| Fast | 5 | N/A | 10 | N/A | N/A | N/A |
| Standard | 8 | 12 | 16 | 24 | 24 | 36 |
| Pro | 12 | 18 | 24 | 36 | 36 | 54 |

**Model constraints:**
- Kling 2.5 Fast: max 10s duration, no native audio
- Kling 3.0 Standard/Pro: 5–15s duration, native audio supported

### Pricing philosophy

- **Optimize for volume and habit formation**, not margin-per-unit
- Kling 2.5 and 3.0 Standard are intentionally near break-even or slightly underwater to encourage experimentation
- Kling 3.0 Pro has a small positive margin for users who want highest quality
- Longer durations and audio provide progressively better margins
- Same strategy as image generation — build user habits first, optimize pricing later
- Credits deducted upfront when the job is submitted
- Credits automatically refunded to user profile if Fal.ai reports failure

### How competitor AI video companies handle costs

Most AI video companies (Pika, Runway, etc.) operate at a loss on generation costs, subsidized by VC funding or subscription revenue. The standard approach:

1. Charge enough credits to offset direct generation costs
2. Absorb storage and delivery costs as platform overhead
3. Offset with subscription tiers and volume commitment

For clip.art, R2's zero egress fees keep ongoing costs minimal (~$0.015/GB/month storage). Longer videos (~10–15 MB at 15s) scale storage cost linearly but delivery remains free.

---

## Video Assets Strategy

Every completed animation produces three assets stored in R2:

### 1. Full MP4 (~3–5 MB)
- H.264 codec for universal compatibility
- Full resolution from Kling output
- User-downloadable via the "Download MP4" button
- Stored at `animations/{category}/{slug}.mp4`

### 2. Preview MP4
- **At launch**: Same as the full MP4 (no compression step)
- **Phase 2**: FFmpeg-compressed 480p loop (~200–400 KB) for performant grid autoplay
- Stored at `animations/{category}/{slug}-preview.mp4` (currently same URL as full)

### 3. Thumbnail WebP (~15–30 KB)
- Generated from the **source clip art image** (not extracted from video)
- Resized to 480px width via Sharp
- Used as poster frame for instant loading before video plays
- Stored at `animations/{category}/{slug}-thumb.webp`

### Why source image as thumbnail (not video frame extraction)

At launch, we skip FFmpeg entirely. Sharp can resize the source image (which we already have) into a WebP thumbnail much faster and without additional binary dependencies. The source image is actually a better poster frame than a random video frame — it's the clean, recognizable clip art the user started with. FFmpeg-based first-frame extraction is planned for phase 2 as an optimization.

---

## Video Format Decision: MP4 (not WebM)

### Why MP4

- **Universal compatibility**: Plays in every browser (Chrome, Safari, Firefox, Edge), every OS (Windows, macOS, iOS, Android), every social platform
- **Download expectation**: Users expect MP4 files when downloading video — it's the de facto standard
- **Editing software**: Every video editor imports MP4; WebM support is spotty
- **Decoding performance**: H.264 hardware decoding is ubiquitous, WebM (VP9) hardware support varies

### Why not WebM

- **Safari compatibility**: WebM/VP9 only supported in Safari 14.1+ (2021), older devices excluded
- **iOS**: WebM support is inconsistent across iOS versions
- **Social sharing**: Many platforms don't accept WebM uploads
- **User confusion**: Non-technical users don't recognize the `.webm` extension

### Future consideration

WebM (VP8/VP9 or AV1) could be offered as a secondary web-optimized format for grid previews in phase 2, where we control playback and don't need download compatibility. The primary download would remain MP4.

---

## Storage Decision: R2 (not Mux/Cloudflare Stream)

### Why R2

- **Zero egress fees**: Critical for video — even small videos at scale would cost significantly on S3/GCS
- **Existing integration**: Same bucket (`clip-art-images`), same `uploadToR2()` utility, same CDN
- **Simple**: Direct file storage, no transcoding pipelines or player SDKs to manage
- **Cost-effective**: 5-second videos at ~3–5 MB each. At 10,000 animations: ~40 GB = ~$0.60/month storage

### Why not Mux

- **Monthly cost**: Mux charges per minute of stored video + per minute of delivered video
- **Overkill**: Our videos are 5 seconds, no adaptive streaming needed, no DRM
- **SDK overhead**: Requires Mux player SDK, additional API integration
- **Premature**: Worth revisiting when we have 100K+ videos or need adaptive streaming

### Why not Cloudflare Stream

- **Per-minute pricing**: $1/1000 minutes stored + $1/1000 minutes delivered
- **Minimum viable at scale**: Better suited for longer video content or live streaming
- **R2 already works**: Zero marginal cost for delivery makes R2 the clear winner for short clips

### Migration path

If we reach a scale where adaptive bitrate streaming, video analytics, or global CDN optimization become necessary, Cloudflare Stream is the natural upgrade from R2 (same ecosystem, easy migration). Documented in the expansion roadmap.

---

## Fal.ai Integration

### Dependencies

```bash
npm install @fal-ai/client @fal-ai/server-proxy
```

### Proxy Route

`app/api/fal/proxy/[...path]/route.ts`

```typescript
import { createRouteHandler } from "@fal-ai/server-proxy/nextjs";

export const { GET, POST, PUT } = createRouteHandler({
  allowedEndpoints: ["fal-ai/kling-video/**"],
});
```

Uses `@fal-ai/server-proxy/nextjs` to create a route handler that:
- Forwards requests to Fal.ai with the `FAL_KEY` injected server-side
- Restricts endpoints to `fal-ai/kling-video/**` (prevents abuse of other Fal.ai models)
- Handles GET, POST, and PUT methods (needed for queue operations)

### Client Library

`src/lib/fal.ts`

Exports:

- `AnimationModel` type: `"kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro"`
- `calculateCredits(model, duration, audio)`: Dynamic credit calculation based on per-second rates
- `MAX_DURATION`: Max duration per model (10 for Fast, 15 for Standard/Pro)
- `AUDIO_SUPPORTED`: Audio capability per model (false for Fast, true for Standard/Pro)
- `MODEL_LABELS`: Human-readable labels per model
- `submitAnimation(imageUrl, prompt, model, duration, audio)`: Submits to Fal.ai queue, returns `{ requestId }`
- `checkAnimationStatus(model, requestId)`: Polls Fal.ai queue, returns status and video URL when complete

### Model endpoint mapping

| Model | Fal.ai Endpoint |
|-------|----------------|
| `kling-2.5-turbo` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` |
| `kling-3.0-standard` | `fal-ai/kling-video/v3/standard/image-to-video` |
| `kling-3.0-pro` | `fal-ai/kling-video/v3/pro/image-to-video` |

### API differences between Kling 2.5 and 3.0

The `buildInput()` function handles the API shape differences:

- **Kling 2.5 Turbo**: Uses `image_url` parameter for source image
- **Kling 3.0 (Standard/Pro)**: Uses `start_image_url` parameter, supports `generate_audio` toggle and durations 5–15s

Both share: `prompt`, `duration` (as string "5" through "15"), `negative_prompt`, `cfg_scale`

### Async queue flow

1. `fal.queue.submit(endpoint, { input })` — Enqueues the job, returns `request_id` immediately
2. `fal.queue.status(endpoint, { requestId, logs: true })` — Returns `IN_QUEUE`, `IN_PROGRESS`, or `COMPLETED`
3. `fal.queue.result(endpoint, { requestId })` — Fetches the completed result including video URL

---

## API Endpoints

### POST /api/animate

`app/api/animate/route.ts`

**Purpose**: Submit a new animation job

**Request body**:
```json
{
  "sourceUrl": "https://images.clip.art/free/cute-cat-abc123.webp",
  "prompt": "Character waves hello and smiles",
  "model": "kling-3.0-standard",
  "duration": 10,
  "audio": true
}
```

**Response (success)**:
```json
{
  "animationId": "uuid",
  "status": "processing",
  "creditsRemaining": 42
}
```

**Error responses**:

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ error: "..." }` | Invalid prompt, missing source URL, or safety check failed |
| 401 | `{ requiresAuth: true }` | Not logged in |
| 402 | `{ requiresCredits: true, creditsNeeded: 8 }` | Insufficient credits |
| 429 | `{ error: "..." }` | Rate limited |
| 500 | `{ error: "..." }` | Fal.ai submission failed |

**Validation rules**:
- `sourceUrl`: Required, must be a valid URL with hostname `images.clip.art`
- `prompt`: Required, string, max 1000 characters, must pass `checkPromptSafety()`
- `model`: Optional, defaults to `kling-3.0-standard` if invalid or missing
- `duration`: Integer 5–15 (clamped to model max: 10 for Fast, 15 for Standard/Pro)
- `audio`: Boolean, enables native AI audio (forced false for Kling 2.5 Fast)

**Flow**:
1. Parse and validate request body
2. Check prompt safety (same filter as image generation)
3. Validate source URL hostname
4. Authenticate user via Supabase session
5. Check credits against model cost
6. Lookup source generation by image URL for metadata
7. Submit to Fal.ai queue via `submitAnimation()`
8. Deduct credits from user profile
9. Insert `animations` row with `status: 'processing'` and `fal_request_id`
10. Return animation ID and remaining credits

### GET /api/animate/status

`app/api/animate/status/route.ts`

**Purpose**: Poll animation status, finalize on completion

**Query params**: `id` (animation UUID)

**Marked as `dynamic = "force-dynamic"`** to prevent Next.js static rendering (uses `nextUrl.searchParams`).

**Response variants**:

Completed:
```json
{
  "status": "completed",
  "videoUrl": "https://images.clip.art/animations/free/cute-cat-anim-xyz789.mp4",
  "previewUrl": "https://images.clip.art/animations/free/cute-cat-anim-xyz789.mp4",
  "thumbnailUrl": "https://images.clip.art/animations/free/cute-cat-anim-xyz789-thumb.webp"
}
```

Processing:
```json
{
  "status": "processing"
}
```

Queued:
```json
{
  "status": "queued",
  "logs": ["Waiting for available GPU..."]
}
```

Failed:
```json
{
  "status": "failed",
  "error": "Animation generation failed. Credits have been refunded."
}
```

**Completion flow** (when Fal.ai reports COMPLETED):
1. Download video from Fal.ai temporary URL into a Buffer
2. Look up source generation for category/slug metadata
3. Generate a unique animation slug: `{source-slug}-anim-{random6}`
4. Upload full MP4 to R2 at `animations/{category}/{animSlug}.mp4`
5. Fetch source image, resize to 480px WebP thumbnail via Sharp
6. Upload thumbnail to R2 at `animations/{category}/{animSlug}-thumb.webp`
7. Update animations row: `status='completed'`, set all URLs, set `completed_at`

**Failure flow** (when Fal.ai reports FAILED):
1. Update animations row: `status='failed'`, set `error_message`
2. Fetch user profile, add `credits_charged` back to balance
3. Update animations row: `status='refunded'`

---

## Video Post-Processing

`src/lib/videoProcessing.ts`

### Current implementation (launch)

```typescript
export async function generateThumbnail(imageBuffer: Buffer, width: number = 480): Promise<Buffer>
```

Uses `sharp` to resize the source image to 480px width WebP. This is the pragmatic launch approach — we use the source clip art image as the poster frame rather than extracting a frame from the video.

### Phase 2: FFmpeg-based processing

Planned additions:
- `generatePreview(videoBuffer)` — Downscale to 480p, compress aggressively, output ~200–400 KB MP4
- `extractFirstFrame(videoBuffer)` — Extract actual first frame from video as WebP

Will use `fluent-ffmpeg` or `@ffmpeg-installer/ffmpeg` for Vercel compatibility.

---

## Frontend

### /animate Page

`app/(app)/animate/page.tsx`

#### Layout

Two-column on desktop (`lg:grid-cols-2`), stacked on mobile.

**Left column**:
- Source image preview (before animation)
- Completed video player with `VideoPlayer` component in `detail` mode
- Before/After toggle buttons (Animation / Original) after completion

**Right column**:
- Motion prompt textarea (1000 char max, Cmd+Enter shortcut)
- AI Suggestions (free, image-specific, duration-aware, powered by Gemini 2.5 Flash)
- Templates (collapsible categorized motion presets)
- Model selector (3 pill buttons with dynamic credit costs)
- Duration slider (5–15s range input with gradient-filled track)
- Audio toggle (native AI audio switch, auto-disabled for Fast model)
- "Animate — X credits" CTA button (dynamically updates as settings change)
- Helper text showing selected duration + audio status
- Error display with Framer Motion animation
- Result actions: Download MP4, View in My Creations

#### Entry points

| Entry Point | URL | Behavior |
|-------------|-----|----------|
| Sidebar "Animate" link | `/animate` | Shows image picker grid from My Creations |
| Drawer "Animate" button | `/animate?id={generation_id}` | Pre-loads source image |
| Detail page "Animate" button | `/animate?id={generation_id}` | Pre-loads source image |

#### Image picker

When no `?id` parameter is provided, the page shows a grid of the user's recent creations (up to 60 images). Clicking an image selects it as the animation source and transitions to the editing interface.

If the user is not signed in, a prompt to create an image first is shown. If signed in but no images exist, a prompt to start creating is shown.

#### Motion prompt presets

| Label | Instruction |
|-------|------------|
| Gentle idle | Gentle breathing idle animation, subtle movement |
| Wave hello | Character waves hello and smiles |
| Slow zoom | Camera slowly zooms in with soft focus |
| Bouncing | Bouncing and bobbing playful motion |
| Turn around | Character turns around slowly |

These are optimized for clip art — simple, contained movements that work well with flat illustration styles.

#### Model selector

Three pill-style buttons in a grid. Credit costs update dynamically based on the current duration and audio settings:

| Button | Model | Credits (5s silent) | Label |
|--------|-------|---------------------|-------|
| Fast | `kling-2.5-turbo` | 5 | Quick preview |
| Standard | `kling-3.0-standard` | 8 | Best value |
| Pro | `kling-3.0-pro` | 12 | Highest quality |

Default selection: Standard (best value).

When switching models:
- Duration clamps to model max (Fast: 10s, Standard/Pro: 15s)
- Audio toggle auto-disables if the model doesn't support it

#### Duration slider

Range input with 1-second increments, gradient-filled track (pink-to-purple), and a prominent `Xs` badge:

- Min: 5s (all models)
- Max: 10s (Fast) or 15s (Standard/Pro)
- Tick marks at 5s, 10s, and max duration
- Automatically adjusts max when model changes

#### Audio toggle

Switch-style toggle with speaker icon:

- **Enabled state**: Purple accent, "AI generates sound effects and voice" subtitle
- **Disabled state**: Gray, standard appearance
- **Unavailable state**: 50% opacity, "Not available with Fast model" subtitle
- Automatically forced off when Kling 2.5 Fast is selected

#### Polling mechanism

After submitting, the page starts a `setInterval` at 5-second intervals, calling `GET /api/animate/status?id={animationId}`. On completion, polling stops and the video player appears. On failure, polling stops and the error message is displayed. Cleanup on unmount prevents memory leaks.

---

## Components

### AnimationProgress

`src/components/AnimationProgress.tsx`

A simulated progress bar tuned for 1–2 minute animation waits. Unlike the `GenerationProgress` used for image generation (~15 seconds), this component has a much slower curve.

**Five phases**:

| Phase | Progress | Message | Timing |
|-------|----------|---------|--------|
| 1 | 0–12% | Submitting to animation queue… | 0–5s (fast ease-in) |
| 2 | 12–32% | Waiting in queue… | 5–20s (linear) |
| 3 | 32–72% | Generating frames… | 20–60s (slow crawl) |
| 4 | 72–92% | Rendering final video… | 60–120s (decelerating) |
| 5 | 92–99% | Almost there… | 120s+ (asymptotic approach) |

Uses `requestAnimationFrame` for smooth updates. The progress bar never reaches 100% until the actual API response arrives, at which point it snaps to complete with a 600ms exit animation.

Displays "Animations typically take 1–2 minutes" as a subtitle.

### VideoPlayer

`src/components/VideoPlayer.tsx`

A reusable `<video>` wrapper with two modes:

**Preview mode** (`mode="preview"`):
- Muted autoplay with loop
- `playsInline` for iOS compatibility
- `preload="none"` to prevent unnecessary downloads
- IntersectionObserver (30% threshold): plays when visible, pauses when scrolled away
- Play overlay icon shown when paused
- `prefers-reduced-motion`: shows static poster image only, no video element

**Detail mode** (`mode="detail"`):
- Full native browser controls (play/pause, progress, volume, fullscreen)
- Loop enabled
- Poster frame displayed while loading (`preload="metadata"`)

**Exports**:
- `VideoPlayer` — Main component
- `AnimationBadge` — "Video" badge with play icon for card overlays

### AnimationBadge

Small pill badge with play icon and "Video" text, used in top-left corner of animated cards to visually distinguish video content from static images.

---

## Mixed Grid: Animated Cards

### ImageCard Enhancement

`src/components/ImageCard.tsx` accepts an optional `animationPreviewUrl` prop.

When present:
- Renders a `<video>` element instead of `<Image>` inside the card
- Video attributes: `muted`, `loop`, `playsInline`, `preload="none"`
- Poster attribute set to `image.url` for instant loading
- Small "Video" badge with play icon in the top-left corner
- IntersectionObserver (30% threshold): only plays when card is in viewport
- `prefers-reduced-motion`: skips video entirely, shows static image

When absent:
- Standard image rendering (no change from existing behavior)

### Grid query pattern (for future implementation)

When fetching content for Browse or My Creations grids, LEFT JOIN to `animations`:

```sql
SELECT g.*, a.preview_url AS animation_preview_url
FROM generations g
LEFT JOIN animations a ON a.source_generation_id = g.id
  AND a.status = 'completed'
  AND a.is_public = true
```

This adds zero overhead for images without animations (NULL join) and seamlessly mixes animated cards into existing grids. The `animation_preview_url` value is passed to `ImageCard` as the `animationPreviewUrl` prop.

---

## Navigation

### Sidebar (`AppSidebar.tsx`)
- Animate item: `soon: false` (enabled), links to `/animate`

### Drawer (`ImageDetailDrawer.tsx`)
- Animate button: `Link` to `/animate?id={image.id}`, closes drawer on click
- Styled with hover state: `hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600`

### Detail Page (`ImageDetailPage.tsx`)
- Animate button: `Link` to `/animate?id={imageId}` (or `/animate` if no imageId)
- Same styling pattern as the Edit button

---

## SEO Video Strategy

### Phase 1 (current)
- All user animations are public by default (`is_public = true`)
- Animations are accessible via direct URL for sharing
- Video file hosted on R2 with same CDN as images

### Phase 2 (planned)
- **Curated hero animations** on top 20 category pages (~$8.40 one-time generation cost at 8 credits each)
- **VideoObject structured data** on detail pages that have animations, for Google rich snippets
- **Mixed media grids** on SEO pages — animated cards silently autoplay among static images (like Craiyon, Pika, Runway homepages)
- **Lazy on-demand generation** for high-traffic pages: detect pages with high organic traffic but no animations, queue animations automatically

### Performance guardrails for animated grids
- IntersectionObserver: only load/play videos when in viewport
- `preload="none"`: no video data fetched until in viewport
- `prefers-reduced-motion`: disable all autoplay for accessibility
- Poster frames: show WebP thumbnail instantly, video replaces when ready
- Phase 2 compressed previews: 480p ~200–400 KB vs full 3–5 MB

---

## Files

| File | Type | Purpose |
|------|------|---------|
| `db/add-animations.sql` | New | Animations table migration |
| `src/lib/fal.ts` | New | Fal.ai client configuration, submit + status functions |
| `src/lib/videoProcessing.ts` | New | Thumbnail generation via Sharp |
| `app/api/fal/proxy/[...path]/route.ts` | New | Fal.ai server proxy (keeps API key server-side) |
| `app/api/animate/route.ts` | New | Submit animation job endpoint |
| `app/api/animate/status/route.ts` | New | Poll animation status, finalize on completion |
| `app/(app)/animate/page.tsx` | New | Animate page with full UI, image picker, model selector |
| `src/components/AnimationProgress.tsx` | New | Long-running progress component (~120s curve) |
| `src/components/VideoPlayer.tsx` | New | Reusable video player with preview and detail modes |
| `src/components/ImageCard.tsx` | Modified | Added `animationPreviewUrl` prop, video rendering, IntersectionObserver |
| `src/components/AppSidebar.tsx` | Modified | Enabled Animate nav link |
| `src/components/ImageDetailDrawer.tsx` | Modified | Wired Animate button with Link |
| `src/components/ImageDetailPage.tsx` | Modified | Wired Animate button on SEO detail pages |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FAL_KEY` | Yes | Fal.ai API key in format `key_id:key_secret` |

Must be set in both `.env.local` (local development) and Vercel environment variables (production).

---

## Database Migration

Run `db/add-animations.sql` against your Supabase database before deploying:

```bash
# Via Supabase CLI
supabase db push

# Or directly in Supabase SQL Editor
# Copy contents of db/add-animations.sql and execute
```

---

## Expansion Roadmap

### Phase 2 — Near-term

| Feature | Description | Complexity | Status |
|---------|-------------|------------|--------|
| FFmpeg preview generation | 480p compressed loop (~200–400 KB) for grid autoplay | Medium | Planned |
| Audio generation | Kling 3.0 native audio toggle | Low | **Shipped** |
| Variable duration (5–15s) | Duration slider, per-second credit pricing | Low | **Shipped** |
| GIF export | Convert MP4 to GIF for social/messaging use | Medium | Planned |
| Video-to-video style transfer | Apply style changes to existing animations | High | Planned |

### Phase 3 — Medium-term

| Feature | Description | Complexity |
|---------|-------------|------------|
| Text-to-video | Generate video from text only (no source image) | Medium |
| Multi-shot storyboarding | Chain multiple 5s clips into longer narratives | High |
| Animation templates library | Pre-built motion patterns users can apply | Medium |
| Batch animation | Animate multiple images at once | Medium |
| Custom motion elements | Character-consistent animation for branded content | High |

### Phase 4 — Long-term

| Feature | Description | Complexity |
|---------|-------------|------------|
| Cloudflare Stream migration | Adaptive streaming at scale, CDN optimization | High |
| WebM secondary format | Web-optimized delivery for grid previews | Low |
| User animation gallery pages | Public profile pages with animation showcase | Medium |
| Animation marketplace | Premium community animations for sale | High |
| Real-time collaborative editing | Multi-user animation editing sessions | Very High |
