# clip.art — AI Clip Art Generator

Generate beautiful clip art in seconds. Describe what you want, pick a style, and download instantly.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Auth + DB:** Supabase (Auth, Postgres)
- **Image Generation:** Gemini 2.5 Flash Image (via `@google/genai`)
- **Image Storage:** Cloudflare R2 (`images.clip.art`)
- **Payments:** Stripe (one-time credit packs)
- **Hosting:** Vercel + Cloudflare CDN

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in all values
2. Run the SQL in `db/migration.sql` in Supabase SQL Editor
3. Configure Google OAuth + Magic Link in Supabase Auth settings
4. Create R2 bucket + custom domain `images.clip.art` in Cloudflare
5. Create Stripe products/prices and add IDs to env

```bash
npm install
npm run dev
```

## Routes

- `/` — Homepage with generator + sample gallery
- `/create` — Authenticated dashboard with generation history
- `/api/generate` — Image generation endpoint
- `/api/credits/checkout` — Stripe checkout session
- `/api/webhooks/stripe` — Stripe webhook handler
