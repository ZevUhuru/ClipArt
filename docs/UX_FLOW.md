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

- Gets **5 free generations** tracked via an `httpOnly` cookie (`clip_art_free`, 30-day expiry).
- Generated images are stored in R2 under `free/{slug}-{uid}.png`.
- No history is persisted — images are ephemeral once the browser tab closes.

### Authenticated (signed in)

- Starts with **5 credits** (set by the `handle_new_user` DB trigger on first signup).
- Each generation costs **1 credit**.
- All generations are saved to the `generations` table and displayed in the History Grid on `/generator`.
- Generated images are stored in R2 under `gen/{userId}/{slug}-{uid}.png` (or `{category}/` if a valid category is specified).

## Generation Flow

```
┌─────────────────────────────────────────────────────┐
│  User enters prompt + selects style                 │
│  ↓                                                  │
│  Click "Generate"                                   │
│  ↓                                                  │
│  POST /api/generate  { prompt, style, category? }   │
│  ↓                                                  │
│  ┌─ Anonymous ─────────────────────────────────┐    │
│  │  cookie < 5?                                │    │
│  │  ├─ YES → Gemini → R2 → return imageUrl    │    │
│  │  │        (increment cookie)                │    │
│  │  └─ NO  → 401 { requiresAuth: true }       │    │
│  │           → Client opens AuthModal          │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─ Authenticated ─────────────────────────────┐    │
│  │  credits > 0?                               │    │
│  │  ├─ YES → Gemini → R2 → return imageUrl    │    │
│  │  │        → deduct 1 credit                 │    │
│  │  │        → insert into generations         │    │
│  │  └─ NO  → 402 { requiresCredits: true }    │    │
│  │           → Client opens BuyCreditsModal    │    │
│  └─────────────────────────────────────────────┘    │
│  ↓                                                  │
│  Image appears with "Download PNG" button           │
└─────────────────────────────────────────────────────┘
```

### Generation Pipeline (server-side)

1. **Validate** — prompt (string, max 500 chars) and style (must be a valid `StyleKey`)
2. **Build prompt** — `buildPrompt(prompt, style)` appends style descriptor + "clip art, isolated object, no text"
3. **Gemini API** — `generateClipArt(fullPrompt)` calls the Nano Banana model (`gemini-2.5-flash-image`) with `responseModalities: ["IMAGE"]`, aspect ratio `1:1`
4. **Upload to R2** — PNG buffer uploaded to Cloudflare R2 with `Cache-Control: public, max-age=31536000, immutable`
5. **Return URL** — `https://images.clip.art/{key}` served via R2 custom domain

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
4. `handle_new_user` trigger creates a `profiles` row with 5 credits
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
│  ├─ Starter: 30 credits — $5                     │
│  └─ Pro:    100 credits — $12                    │
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

- 10 categories: `christmas`, `heart`, `halloween`, `flower`, `school`, `book`, `pumpkin`, `cat`, `thanksgiving`, `free`
- Pre-rendered at build time via `generateStaticParams()`
- Custom SEO metadata per category (title, description, OG tags)
- Displays a grid of curated sample images from `sampleGallery.ts`
- Light-themed layout with `CategoryNav` (white background, brand gradient stripe)

### Image Detail Page (`/{category}/{slug}`)

- Pre-rendered for all 29 sample images via `generateStaticParams()`
- Structured data: `ImageObject` + `BreadcrumbList` JSON-LD
- Full-bleed image display with descriptive alt text
- "Download Free" button — direct download from R2, no credits needed
- Related images grid showing other images in the same category

## Client State (Zustand)

| State | Type | Purpose |
|-------|------|---------|
| `user` | `{ id, email } \| null` | Current authenticated user |
| `credits` | `number` | Live credit balance, updated after generation and purchase |
| `authModalMode` | `"signin" \| "signup" \| null` | Controls AuthModal visibility and mode |
| `isBuyCreditsOpen` | `boolean` | Controls BuyCreditsModal visibility |

## Database Schema

Three tables (all with RLS enabled):

### `profiles`
- `id` (uuid, PK, FK → auth.users)
- `email` (text)
- `credits` (integer, default 5)
- `created_at` (timestamptz)
- Auto-created via `handle_new_user` trigger on signup

### `generations`
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `prompt` (text)
- `style` (text)
- `image_url` (text)
- `created_at` (timestamptz)
- Indexed on `user_id` and `created_at DESC`

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
