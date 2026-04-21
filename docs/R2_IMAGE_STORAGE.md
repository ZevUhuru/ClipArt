# R2 Image Storage Plan

> ⚠️ **Transitional — moving to ESY.**
>
> R2 upload responsibility moves out of clip.art and into ESY (`api.esy.com`) during Phase 3 of the migration. Post-migration clip.art will NOT hold R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, etc.). ESY's API returns `image_url` pointing at ESY-owned R2; clip.art serves those URLs through `images.clip.art` (which CNAMEs to ESY's bucket).
>
> The directory structure conventions below (`{category}/`, `coloring-pages/{theme}/`, `illustrations/{category}/`) remain the source of truth — ESY will mirror them.
>
> See [`docs/esy/04-migration-tracker.md`](esy/04-migration-tracker.md) (status: `src/lib/r2.ts`) and [`docs/esy/01-architecture.md`](esy/01-architecture.md#environment-variables) for the post-migration env var setup.

---

## Overview

Cloudflare R2 storage for all clip art images, served via `images.clip.art` custom domain. Category-based directory structure for SEO and organization.

## Source Reference

Modeled on esy.com's R2 scripts (`scripts/r2-upload-single-image.mjs`, `scripts/r2-upload-flexible-directory-paths.mjs`).

## Directory Structure

```
images.clip.art/
  christmas/          santa-riding-sleigh.a3f82b91c0.webp
  heart/              watercolor-red-heart.7c2e4f1a9b.webp
  halloween/          cute-ghost-trick-or-treat.d91e3a7f2c.webp
  flower/             pink-rose-bouquet.b4c8e2f1a0.webp
  school/             colorful-classroom-globe.f2a1c9d8e3.webp
  book/               open-book-magic-sparkles.e7b3a4c1d9.webp
  pumpkin/            carved-jack-o-lantern.c1d2e3f4a5.webp
  cat/                kitten-playing-yarn.a9b8c7d6e5.webp
  thanksgiving/       cartoon-turkey-pilgrim-hat.d4e5f6a7b8.webp
  free/               catch-all for uncategorized / anonymous generations
  gen/{userId}/       authenticated user generations
```

## Image Processing Pipeline

```
Generation:  Gemini PNG → Sharp WebP (quality 85) → R2 upload
Download:    R2 WebP → Sharp PNG conversion → user receives .png
Display:     R2 WebP → Next.js Image Optimization → browser (smallest format)
```

- **Storage format**: WebP (quality 85, effort 4) — ~50-70% smaller than PNG
- **Download format**: PNG — converted on-the-fly by `/api/download` via Sharp
- **Why WebP for storage**: Reduces R2 storage costs, faster page loads, lower CDN bandwidth
- **Why PNG for downloads**: Universal format users expect; works in all editors and tools

## File Naming Convention

### Seed images (migrated from local samples)
```
{category}/{slug}.{hash10}.webp
```
- `hash10`: first 10 chars of SHA-256 content hash (cache busting)

### AI-generated images
```
{category}/{slug}-{random6}.webp
```
- `random6`: 6-char random string (collision avoidance)

### Common rules
- `slug`: slugified image name (lowercase, hyphens, no special chars)
- Format: WebP (quality 85) via Sharp
- Cache: `Cache-Control: public, max-age=31536000, immutable`

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/r2-upload-clipart.mjs` | Upload single image | `node scripts/r2-upload-clipart.mjs --file=./santa.png --category=christmas --name=santa-riding-sleigh` |
| `scripts/r2-batch-upload.mjs` | Upload folder of images | `node scripts/r2-batch-upload.mjs --dir=./generated/flower --category=flower` |

Both scripts support `--dry` for preview without uploading.

## Env Vars Required

```
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=clip-art-images
R2_PUBLIC_URL=https://images.clip.art
```

## Seeding Strategy

100 images/day across 10 categories. Distribution based on keyword volume and KD:

| Category | Images/day | Monthly SV | KD |
|----------|-----------|-----------|-----|
| flower | 12 | 5.9K | 1 |
| heart | 12 | 8K | 0 |
| cat | 10 | 4.9K | 1 |
| book | 10 | 5.6K | 1 |
| school | 10 | 5.7K | 1 |
| christmas | 10 | 12K | 1 |
| halloween | 10 | 7.7K | 4 |
| thanksgiving | 8 | 4.6K | 4 |
| pumpkin | 8 | 5.2K | 0 |
| free | 10 | — | — |

Adjust seasonal categories as their peak approaches.
