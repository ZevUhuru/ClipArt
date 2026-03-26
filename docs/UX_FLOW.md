# UX Flow

Complete user experience flow for clip.art — from first visit through generation, download, and credit purchase.

## Routes

| Route | Purpose | Auth required |
|-------|---------|---------------|
| `/` | Homepage — mosaic background, centered generator card | No |
| `/generator` | Authenticated dashboard — Nav, Generator, HistoryGrid | Yes |
| `/{category}` | SEO category index (e.g. `/flower`, `/christmas`) | No |
| `/{category}/{slug}` | SEO image detail page with download | No |

## User Types

### Anonymous (no account)

- Can browse all public gallery/category pages and image detail pages.
- Gets **1 free generation** on the homepage without signing up (see [FREE_GENERATION.md](FREE_GENERATION.md)).
- After the free generation, clicking "Generate" opens the AuthModal (signup mode).
- The free generation result is shown on `/create` with a CTA to sign up for 10 credits.

### Authenticated (signed in)

- Starts with **10 credits** (set by the `handle_new_user` DB trigger on first signup).
- Each generation costs **1 credit**.
- All generations are saved to the `generations` table and displayed in the History Grid on `/generator`.
- Generated images are stored in R2 under `{category}/{slug}-{uid}.webp`.

## Generation Flow

```
┌─────────────────────────────────────────────────────┐
│  User enters prompt + selects style                 │
│  ↓                                                  │
│  Click "Generate"                                   │
│  ↓                                                  │
│  Client checks user state                           │
│  ├─ No user → opens AuthModal (signup) immediately  │
│  └─ Signed in → continues ↓                         │
│  ↓                                                  │
│  POST /api/generate  { prompt, style }              │
│  ↓                                                  │
│  ┌─ Server-side checks ───────────────────────┐     │
│  │  No session?  → 401 { requiresAuth }       │     │
│  │  credits ≤ 0? → 402 { requiresCredits }    │     │
│  │  OK?          → continue ↓                 │     │
│  └────────────────────────────────────────────┘     │
│  ↓                                                  │
│  Gemini → Sharp (PNG→WebP) → R2 upload              │
│  → classify prompt → deduct 1 credit                │
│  → insert into generations → revalidate cache       │
│  ↓                                                  │
│  Image appears with "Download PNG" button           │
└─────────────────────────────────────────────────────┘
```

### Generation Pipeline (server-side)

1. **Validate** — prompt (string, max 500 chars) and style (must be a valid `StyleKey`)
2. **Build prompt** — `buildPrompt(prompt, style)` appends style descriptor + "clip art, isolated object, no text"
3. **Gemini Image API** — `generateClipArt(fullPrompt)` calls `gemini-2.5-flash-image` with `responseModalities: ["IMAGE"]`, aspect ratio `1:1`, returns PNG buffer
4. **Convert to WebP** — Sharp converts PNG → WebP (quality 85, effort 4), ~50-70% smaller
5. **Auto-classify** — `classifyPrompt(prompt, style)` calls Gemini Flash text to generate clean title, category, SEO description, and URL slug (see [AUTO_CLASSIFICATION.md](AUTO_CLASSIFICATION.md))
6. **Upload to R2** — WebP buffer uploaded to `images.clip.art/{category}/{slug}-{uid}.webp` with `Content-Type: image/webp` and immutable cache headers
7. **Save to DB** — Insert into `generations` with clean metadata from classifier
8. **Bust cache** — `revalidatePath('/{category}')` for instant Vercel edge cache refresh
9. **Return URL** — `https://images.clip.art/{key}` served via R2 custom domain

### Download Pipeline

1. **User clicks "Download PNG"** → client calls `/api/download?url={r2_url}`
2. **Proxy fetches** from R2 (WebP) → buffers the response
3. **Sharp converts** WebP → PNG on the fly
4. **Response** streamed with `Content-Disposition: attachment; filename="{slug}.png"`
5. User receives a standard PNG file regardless of storage format

### Available Styles

| Key | Descriptor |
|-----|-----------|
| `flat` | Flat vector illustration, white background, no shadows, bold outlines |
| `outline` | Minimal outline illustration, white background, thin clean lines, monochrome |
| `cartoon` | Cartoon style illustration, white background, bold colors, friendly characters |
| `sticker` | Sticker illustration style, white background, thick outline, vibrant colors, cute |
| `vintage` | Vintage retro illustration, muted colors, textured, nostalgic style |

## Authentication Flow

Powered by Supabase Auth. Two methods:

### Google OAuth

1. User clicks "Continue with Google" in AuthModal
2. Redirects to Google consent screen
3. Returns to `/auth/callback` → Supabase exchanges code for session
4. `handle_new_user` trigger creates a `profiles` row with 10 credits
5. User redirected to `/generator`

### Email Magic Link

1. User enters email in AuthModal
2. Supabase sends a magic link email
3. User clicks link → `/auth/callback` validates the token
4. Same trigger creates profile if new user
5. User redirected to `/generator`

## Credit Purchase Flow

```
┌──────────────────────────────────────────────────┐
│  BuyCreditsModal opens (triggered by 402 or Nav) │
│  ↓                                               │
│  User selects a credit pack:                     │
│  ├─ Starter: 100 credits — $4.99                 │
│  └─ Pro:     200 credits — $9.99                 │
│  ↓                                               │
│  POST /api/credits/checkout  { packId }          │
│  ↓                                               │
│  Stripe Checkout session created with metadata:  │
│    userId, credits count                         │
│  ↓                                               │
│  User redirected to Stripe hosted checkout       │
│  ↓                                               │
│  Payment completes → Stripe fires webhook        │
│  POST /api/webhooks/stripe                       │
│  ↓                                               │
│  Webhook handler:                                │
│  1. Verify signature                             │
│  2. Read metadata (userId, credits)              │
│  3. profiles.credits += purchased credits        │
│  4. Insert into purchases table                  │
│  ↓                                               │
│  User redirected to /generator?success=true      │
│  Credit badge updates in Nav                     │
└──────────────────────────────────────────────────┘
```

## SEO Page Flow (Public Gallery)

### Category Page (`/{category}`)

- Categories stored in DB `categories` table (started with 10, scaling to 100+). See [DYNAMIC_CATEGORIES.md](DYNAMIC_CATEGORIES.md)
- Pre-rendered at build time via `generateStaticParams()`, new categories render on-demand (ISR, 60s revalidation)
- SEO metadata pulled from DB: `meta_title`, `meta_description`, OG tags
- Displays DB-sourced gallery images (from `generations` table) + static sample images
- Includes search bar with client-side sample filtering + server-side DB full-text search
- Light-themed layout with `CategoryNav` (white background, brand gradient stripe)

### Image Detail Page (`/{category}/{slug}`)

- Static sample images pre-rendered via `generateStaticParams()`
- DB-generated images resolved by `slug` column first, then `id` fallback (ISR, 60s revalidation)
- Structured data: `ImageObject` + `BreadcrumbList` JSON-LD
- Full-bleed image display with descriptive alt text
- "Download Free" button — proxied via `/api/download` for cross-origin R2 downloads
- Related images grid showing other images in the same category

## Client State (Zustand)

| State | Type | Purpose |
|-------|------|---------|
| `user` | `{ id, email } \| null` | Current authenticated user |
| `credits` | `number` | Live credit balance, updated after generation and purchase |
| `authModalMode` | `"signin" \| "signup" \| null` | Controls AuthModal visibility and mode |
| `isBuyCreditsOpen` | `boolean` | Controls BuyCreditsModal visibility |

## Database Schema

Four tables (all with RLS enabled):

### `profiles`
- `id` (uuid, PK, FK → auth.users)
- `email` (text)
- `credits` (integer, default 15)
- `is_admin` (boolean, default false)
- `created_at` (timestamptz)
- Auto-created via `handle_new_user` trigger on signup

### `generations`
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `prompt` (text)
- `style` (text)
- `image_url` (text)
- `title` (text) — clean display title from auto-classifier
- `slug` (text, unique) — URL-friendly slug for detail pages
- `description` (text) — SEO description from auto-classifier
- `category` (text) — category slug
- `is_public` (boolean, default false) — gallery visibility
- `search_vector` (tsvector) — auto-populated for full-text search
- `created_at` (timestamptz)
- Indexed on `user_id`, `created_at DESC`, `category + is_public`, GIN on `search_vector`

### `categories`
- `id` (uuid, PK)
- `slug` (text, unique) — URL path segment
- `name` (text) — display name
- `h1`, `meta_title`, `meta_description`, `intro` (text) — SEO fields
- `seo_content` (text[]) — paragraphs of SEO copy
- `suggested_prompts` (text[]) — example prompts for CTA
- `related_slugs` (text[]) — linked category slugs
- `image_count` (integer) — denormalized count
- `is_active` (boolean) — visibility toggle
- `sort_order` (integer) — display ordering
- See [DYNAMIC_CATEGORIES.md](DYNAMIC_CATEGORIES.md) for full details

### `purchases`
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `stripe_session_id` (text, unique)
- `credits_added` (integer)
- `amount_cents` (integer)
- `created_at` (timestamptz)

## Error States

| HTTP | Response | Client behavior |
|------|----------|----------------|
| `401` | `{ requiresAuth: true }` | Opens AuthModal (signup mode) |
| `402` | `{ requiresCredits: true }` | Opens BuyCreditsModal |
| `429` | `{ error: "Too many requests..." }` | Shows inline error, user retries |
| `503` | `{ error: "Image generation service..." }` | Shows inline error (billing not configured) |
| `500` | `{ error: "Generation failed..." }` | Shows inline error, user retries |
