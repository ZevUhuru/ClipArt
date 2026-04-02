# Animation Feature — Kling AI via Fal.ai

Animate any generated clip art into a 5-second MP4 video using Kling 2.5 Turbo, 3.0 Standard, or 3.0 Pro through the Fal.ai platform.

## Architecture Overview

```
User clicks "Animate" → /animate page → POST /api/animate
  → Fal.ai queue.submit → Returns request_id → Insert animations row
  → Poll GET /api/animate/status every 5s
  → On complete: download video → upload to R2 → update row → show video
```

### Why Fal.ai (not direct Kling API)

- First-class Next.js support via `@fal-ai/server-proxy`
- Built-in async queue management (`queue.submit`, `queue.status`, `queue.result`)
- Pay-as-you-go billing — no minimums, no contracts
- Unified API across Kling 2.5 and 3.0 models
- Direct Kling API requires $1,400+/month commitment

## Data Model

Separate `animations` table (not in `generations`) because videos have different lifecycle, cost structure, and media type.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Owner (FK → auth.users) |
| source_generation_id | uuid | Source image (FK → generations) |
| prompt | text | Motion description |
| model | text | kling-2.5-turbo, kling-3.0-standard, kling-3.0-pro |
| duration | integer | Video length in seconds (5 at launch) |
| status | text | processing, completed, failed, refunded |
| fal_request_id | text | Fal.ai queue request ID for polling |
| video_url | text | Full MP4 in R2 |
| preview_url | text | Preview MP4 for grid autoplay |
| thumbnail_url | text | WebP poster frame |
| credits_charged | integer | Credits deducted |
| is_public | boolean | Visible in public grids |

Migration: `db/add-animations.sql`

## Credit Pricing

| Model | Duration | Credits | Our Revenue | Fal.ai Cost |
|-------|----------|---------|-------------|-------------|
| Kling 2.5 Turbo (Fast) | 5s | 5 | 25¢ | ~35¢ |
| Kling 3.0 Standard | 5s | 8 | 40¢ | ~42¢ |
| Kling 3.0 Pro | 5s | 12 | 60¢ | ~56¢ |

Strategy: optimize for volume and habit formation. Kling 2.5 and 3.0 Standard are near break-even; Pro has slight margin. Credits deducted upfront, refunded on failure.

## Video Assets Strategy

Every completed animation produces:

1. **Full MP4** (~3–5 MB) — H.264, user-downloadable, universal compatibility
2. **Preview MP4** — Same as full at launch (FFmpeg-compressed 480p preview in phase 2)
3. **Thumbnail WebP** (~15–30 KB) — Source image resized as poster frame

All stored in R2 under `animations/{category}/{slug}.mp4`.

### Why R2

- Zero egress fees (critical for video)
- Existing integration and bucket
- 5-second videos at ~3–5 MB each are manageable
- Cloudflare Stream / Mux deferred until volume justifies it

### Why MP4 (not WebM)

- Universal browser, OS, social media, editing software support
- Better decoding performance across devices
- Users expect MP4 for downloads

## API Endpoints

### POST /api/animate

`app/api/animate/route.ts`

- Auth required
- Validates prompt (length ≤ 1000, safety check) and source URL (must be images.clip.art)
- Deducts credits upfront based on model
- Submits to Fal.ai queue via `submitAnimation()`
- Creates `animations` row with `status: processing`
- Returns `{ animationId, status, creditsRemaining }`

### GET /api/animate/status?id=

`app/api/animate/status/route.ts`

- Auth required (must own the animation)
- If already completed: returns cached URLs
- If processing: polls Fal.ai, and on completion:
  1. Downloads video from Fal.ai temp URL
  2. Generates thumbnail from source image via Sharp
  3. Uploads video + thumbnail to R2
  4. Updates animations row
- On failure: refunds credits automatically

## Frontend

### /animate page

`app/(app)/animate/page.tsx`

Two-column layout (stacked on mobile):

**Left**: Source image → completed video player with before/after toggle

**Right**:
- Motion prompt textarea (1000 char, Cmd+Enter)
- Quick motion presets (Gentle idle, Wave hello, Slow zoom, Bouncing, Turn around)
- Model selector (Fast / Standard / Pro) with credit costs
- Animate CTA button
- AnimationProgress component (tuned for 1–2 minute waits)
- Result actions: Download MP4, Animate Again, View in My Creations

### Entry points

- Sidebar "Animate" link → `/animate` (shows image picker)
- Drawer "Animate" button → `/animate?id={generation_id}`
- Detail page "Animate" button → `/animate?id={generation_id}`

### AnimationProgress component

`src/components/AnimationProgress.tsx`

Simulated progress over ~120 seconds with five phases:
1. Submitting to queue (0–10%)
2. Waiting in queue (10–20%)
3. Generating frames (20–75%)
4. Rendering final video (75–92%)
5. Almost there (92–99%)

### VideoPlayer component

`src/components/VideoPlayer.tsx`

Reusable `<video>` wrapper with two modes:
- **preview**: muted autoplay loop with IntersectionObserver play/pause
- **detail**: full controls, poster frame

Respects `prefers-reduced-motion` — shows static poster only.

## Mixed Grid: Animated Cards

`ImageCard` accepts optional `animationPreviewUrl` prop. When present:
- Renders `<video>` instead of `<Image>` inside the card
- Muted, autoplay, loop, playsInline
- IntersectionObserver: play when visible, pause when scrolled away
- "Video" badge in top-left corner
- `prefers-reduced-motion`: shows static image only

Grid queries LEFT JOIN to `animations` table to surface completed public animations.

## SEO Video Strategy (Phase 2)

- Curated hero animations on top category pages
- User-generated animations public by default
- VideoObject structured data for Google rich snippets
- Lazy on-demand generation for high-traffic pages

## Expansion Roadmap

### Phase 2 — Near-term
- FFmpeg-based preview generation (480p compressed loop)
- Audio generation toggle (Kling 3.0 supports it)
- 10-second duration option
- GIF export (for social/messaging use)
- Video-to-video style transfer

### Phase 3 — Medium-term
- Text-to-video (no source image required)
- Multi-shot storyboarding
- Animation templates / presets library
- Batch animation (animate multiple images at once)
- Custom motion elements for character consistency

### Phase 4 — Long-term
- Cloudflare Stream migration for adaptive streaming at scale
- WebM as secondary format for web-optimized delivery
- User animation gallery pages
- Animation marketplace (premium community animations)
- Real-time collaborative animation editing
