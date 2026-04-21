# Multi-Model Image Generation

**Date:** 2026-03-22
**Updated:** 2026-04-21 (added GPT Image 2 / ChatGPT Images 2.0; renamed legacy "dalle" key to "gpt-image-1")
**Status:** Shipped

## Overview

The image generation pipeline supports multiple AI models (Gemini, GPT Image 1, GPT Image 2) with automatic routing per style. Admin can override which model powers each style via the admin panel — no code deploy required.

## Architecture

```
User prompt + style
       |
       v
  generateImage(prompt, style)
       |
       v
  resolveModel(style)
       |
       +-- Check site_settings DB (60s cache)
       |      |
       |      +-- Override found → use DB model
       |      +-- No override → use STYLE_MODEL_MAP default
       |
       v
  Model Router
       |
       +-- "gemini"       → generateClipArt() via Gemini API
       +-- "gpt-image-1"  → generateWithGptImage1() via OpenAI (gpt-image-1)
       +-- "gpt-image-2"  → generateWithGptImage2() via OpenAI (gpt-image-2)
       |
       v
  Raw image buffer → Sharp WebP → Classify → R2 → DB
```

## Models

| Model | Provider | Cost/image (square 1024²) | Cost/image (non-square 1024×1536 or 1536×1024) | Quality | Speed |
|-------|----------|--------------------------|------------------------------------------------|---------|-------|
| Gemini 2.5 Flash | Google | ~$0.039 | ~$0.039 | Good for clean clip art | ~5-10s |
| Gemini 2.5 Flash (batch) | Google | ~$0.0195 | ~$0.0195 | Same (batch mode) | Async |
| GPT Image 1 (low, default) | OpenAI | $0.011 | $0.016 | Cheapest; older model | ~10-15s |
| GPT Image 2 (medium) | OpenAI | **$0.053** | **$0.041** | SOTA — in-image text, multilingual, up to 2K | ~10-15s |

Pricing source: developers.openai.com per-image calculator, verified 2026-04-21.

Key observations:

- **GPT Image 1 at low quality** is the cheapest option across the board and is ~3.5× cheaper than Gemini for square images.
- **GPT Image 2 at medium** is **26% more expensive than GPT Image 1 for square clipart** ($0.053 vs $0.042 medium, or $0.011 vs low) but **35% cheaper than GPT Image 1 medium for non-square content** ($0.041 vs $0.063). Illustrations (4:3) and coloring pages (3:4) benefit most from GPT Image 2.
- **GPT Image 2 does not support transparent backgrounds** or the `input_fidelity` param. Our clipart prompts already request plain white backgrounds, so this isn't a blocker.
- **Token-based editing** (Responses API) is cheaper on GPT Image 2 across the board: image output $30/M vs $40/M, image input $8/M vs $10/M.

## Configuration

### Code defaults (`src/lib/styles.ts`)

`STYLE_MODEL_MAP` defines the fallback model for each style. All default to Gemini.

### Admin overrides (`/admin/models`)

The admin panel at `/admin/models` shows a table of styles with model dropdowns. Changes are saved to the `site_settings` table (key: `model_config`) and take effect within 60 seconds (cache TTL).

### Database

`site_settings` table (key-value):
- `key`: `"model_config"`
- `value`: JSON object mapping style names to model keys

## Files

| File | Purpose |
|------|---------|
| `src/lib/gptImage1.ts` | GPT Image 1 generation function |
| `src/lib/gptImage2.ts` | GPT Image 2 generation function (ChatGPT Images 2.0) |
| `src/lib/imageGen.ts` | Unified router — resolveModel + generateImage |
| `src/lib/gemini.ts` | Gemini generation function (unchanged) |
| `src/lib/styles.ts` | STYLE_MODEL_MAP defaults, ModelKey type |
| `app/api/generate/route.ts` | Uses generateImage instead of generateClipArt directly |
| `app/api/admin/settings/model-config/route.ts` | GET/PUT for model config |
| `app/admin/models/page.tsx` | Admin UI for model configuration |
| `db/add-site-settings.sql` | Migration for site_settings table |

## Adding a new model

1. Create `src/lib/{model}.ts` with a `generateWith{Model}(prompt: string): Promise<Buffer>` function
2. Add the model key to `ModelKey` type in `src/lib/styles.ts`
3. Add a case in the switch statement in `src/lib/imageGen.ts`
4. Add the model option to the `MODELS` array in `app/admin/models/page.tsx`
5. Add the env var to `.env.local`
