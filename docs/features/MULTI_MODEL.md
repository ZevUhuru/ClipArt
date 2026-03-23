# Multi-Model Image Generation

**Date:** 2026-03-22
**Status:** Shipped

## Overview

The image generation pipeline supports multiple AI models (Gemini, GPT Image 1) with automatic routing per style. Admin can override which model powers each style via the admin panel — no code deploy required.

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
       +-- "gemini" → generateClipArt() via Gemini API
       +-- "dalle"  → generateWithDallE() via OpenAI API
       |
       v
  Raw image buffer → Sharp WebP → Classify → R2 → DB
```

## Models

| Model | Provider | Cost/image | Quality | Speed |
|-------|----------|-----------|---------|-------|
| Gemini 2.5 Flash | Google | ~$0.002 | Good for clean clip art | ~5-10s |
| GPT Image 1 | OpenAI | ~$0.011 | Better for artistic/textured styles | ~10-15s |

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
| `src/lib/dalle.ts` | GPT Image 1 generation function |
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
