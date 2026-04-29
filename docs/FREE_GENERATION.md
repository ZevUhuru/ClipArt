# Anonymous Free Generation

One free generation for anonymous users on the homepage — no signup required. Converts browsers into users by letting them experience the product before committing.

## Rationale

The biggest drop-off in any freemium funnel is the signup wall before the user has experienced value. By giving anonymous visitors one free generation, we:

1. **Remove friction to the "aha moment"** — the user sees their custom clip art before signing up
2. **Create emotional investment** — once they see "their" image, signing up for 10 more feels obvious
3. **Introduce the app** — after generation, they're redirected to `/create` where they experience the full interface
4. **Don't conflict with existing messaging** — the hero still says "10 free credits — included when you sign up", and the free generation is a bonus on top of that

## User Flow

### Current queue-based flow

```
┌─────────────────────────────────────────────────────────────┐
│  Anonymous user lands on homepage                           │
│  ↓                                                         │
│  Enters a prompt, selects a style                          │
│  ↓                                                         │
│  Sees "Generate Now" button (indicates free first try)     │
│  ↓                                                         │
│  POST /api/generate  { prompt, style, freeGen: true }      │
│  ↓                                                         │
│  ┌─ Server-side ──────────────────────────────────────┐    │
│  │  1. Prompt safety check (blocklist)                │    │
│  │  2. Generate image (same pipeline as normal)       │    │
│  │  3. Upload to R2                                   │    │
│  │  4. Skip credit deduction (no user profile)        │    │
│  │  5. Skip generations table insert (no user_id)     │    │
│  │  6. Return { imageUrl, title, category, slug }     │    │
│  └────────────────────────────────────────────────────┘    │
│  ↓                                                         │
│  Client queues the job and redirects to /create            │
│  ↓                                                         │
│  /create shows the active job in the generation queue      │
│  ↓                                                         │
│  Client receives result, marks free generation as used,    │
│  and the completed queue card opens the downloadable image │
│  ↓                                                         │
│  User tries to generate again → auth modal opens           │
│  "Sign up for 10 free credits"                             │
└─────────────────────────────────────────────────────────────┘
```

### Previous homepage-wait flow

Before the queue handoff, the homepage submitted the anonymous generation directly and kept the visitor on the hero form while the inline `GenerationProgress` component showed "Creating..." / generation progress. After the API returned, the client stored `{ imageUrl, prompt, style }` in `sessionStorage("clip_art_anon_result")`, marked `localStorage("clip_art_free_gen")`, and redirected to `/create`.

On `/create`, a separate anonymous result banner read and cleared the sessionStorage payload. The banner showed the finished image and asked the visitor to sign up to save it and receive 10 credits, but it did not expose the normal queue/drawer download path. That meant the homepage promised "generate, download" while the post-generation state mainly pushed account creation.

## State Management

### Client-side tracking (localStorage)

| Key | Value | Purpose |
|-----|-------|---------|
| `clip_art_free_gen` | `"1"` | Set after first anonymous generation. Persists across sessions. |

When this key exists and the user is not signed in:
- The Generate button shows "Generate" (not "Generate Now")
- Clicking Generate opens the auth modal instead of generating

When this key does NOT exist and the user is not signed in:
- The Generate button shows "Generate Now"
- Clicking Generate sends the request with `freeGen: true`

### Result handoff (generation queue)

The homepage adds the anonymous job to the persisted generation queue before routing to `/create`. This lets visitors watch progress in the app shell instead of waiting on the homepage.

The completed queue card opens the normal image drawer, where the image can be downloaded. Anonymous generations are still ephemeral: they have an R2 URL, but no `generations` row.

## Button States (Homepage Generator)

| User state | Free gen used? | Button text | On click |
|------------|----------------|-------------|----------|
| Signed in | — | "Generate" | Normal generation (uses 1 credit) |
| Anonymous | No | "Generate Now" | Queue anonymous generation, redirect to /create |
| Anonymous | Yes | "Generate" | Opens auth modal (signup) |

## API Changes (`/api/generate`)

### New request parameter

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `freeGen` | boolean | `false` | When true, skips auth and credit checks |

### Modified flow for `freeGen: true`

1. **Prompt safety check** — runs before generation, rejects blocked content (see below)
2. **Skip auth** — no user session required
3. **Skip credit check** — no profile lookup or deduction
4. **Generate + upload** — same pipeline (generateImage → Sharp → R2 → classify)
5. **Skip DB insert** — no `generations` row created (no `user_id` to associate)
6. **Return** — `{ imageUrl, classification }` (no `credits` or `generation` fields)

### Why no DB record for anonymous generations

The `generations` table requires `user_id` (FK → profiles). Rather than making this nullable and complicating every query that joins on it, anonymous generations are ephemeral:
- The image lives on R2 (publicly accessible via CDN)
- No generation record means it won't appear in gallery pages or search
- If the user signs up and re-generates, they get a proper tracked generation
- This keeps the data model clean and avoids orphaned records

## Prompt Safety

A basic content filter runs on ALL prompts (not just anonymous ones) as a first layer of defense before sending to the AI model.

### Blocklist categories

| Category | Examples | Why blocked |
|----------|----------|-------------|
| Explicit/sexual content | Obvious NSFW terms | Would create inappropriate public images |
| Hate speech/slurs | Racial, ethnic, religious slurs | Legal and brand risk |
| Violence (graphic) | Gore, torture, etc. | Inappropriate for a family-friendly product |
| Prompt injection | "ignore previous instructions", "system prompt" | Attempts to manipulate the AI model |

### Implementation

- Simple regex-based blocklist in `src/lib/promptSafety.ts`
- Returns `{ safe: boolean, reason?: string }`
- API returns `400 { error: "..." }` if unsafe
- This is a first layer — the AI models (GPT Image, Gemini) have their own built-in safety filters as a second layer

### Why not more aggressive filtering

- Over-filtering blocks legitimate prompts (false positives hurt UX)
- The AI models already refuse most problematic content
- Images are WebP files, not user-generated text — SEO risk from bad prompts is limited to the auto-classified title/slug which the classifier sanitizes
- We can tighten filtering later based on observed abuse patterns

## Abuse Considerations

### Why we're relaxed about abuse

Anonymous users generating extra images via cookie clearing is not a business threat:

1. **Every generation creates content** — even "abused" generations produce images that populate the platform
2. **Generation costs are low** — ~$0.05-0.08 per generation (see [PRICING_STRATEGY.md](PRICING_STRATEGY.md))
3. **The funnel still works** — most users won't bother clearing localStorage; they'll sign up
4. **No DB records** — anonymous generations don't create orphaned data

### Future hardening (if needed)

If anonymous generation abuse becomes a cost concern:

| Level | Approach | Complexity |
|-------|----------|------------|
| 1 | Rate limit by IP (1/hour) | Low — middleware or API check |
| 2 | Browser fingerprinting | Medium — FingerprintJS or similar |
| 3 | CAPTCHA before anonymous generation | Medium — Turnstile or reCAPTCHA |
| 4 | Remove anonymous generation entirely | None — revert to current behavior |

## Create Page Changes (`/create`)

The create page uses `GenerationQueue` as the anonymous result surface:

- The homepage queues the first free anonymous generation and redirects immediately to `/create`
- The user sees progress in the queue area while the app shell is visible
- Once complete, clicking the queue thumbnail opens the image drawer with the normal download action
- Creating additional images still requires signup; after signup, the user has 10 credits and can continue

## Files Changed

| File | Change |
|------|--------|
| `src/lib/promptSafety.ts` | **New** — blocklist utility |
| `app/api/generate/route.ts` | Support `freeGen` flag, add safety check |
| `src/components/Generator.tsx` | localStorage tracking, button text, queue job + redirect |
| `src/stores/useGenerationQueue.ts` | Support anonymous free generation jobs and completed queue downloads |
| `app/(app)/create/page.tsx` | Create surface relies on the queue instead of a separate anonymous result banner |

## Metrics to Watch

1. **Anonymous generation rate** — how many visitors use the free try (target: >15% of homepage visitors)
2. **Free-gen-to-signup conversion** — % who sign up after using free generation (target: >30%)
3. **Time-to-signup** — should decrease vs current flow (signup wall before value)
4. **Abuse rate** — anonymous generations per unique IP (monitor, don't optimize prematurely)
