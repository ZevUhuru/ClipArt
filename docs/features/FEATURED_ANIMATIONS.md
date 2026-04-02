# Featured Animations Admin

## Overview

Admin-controlled curation for which animations appear on the homepage. Two independent flags give separate control over the "AI Animated Clip Art" grid section and the hero mosaic background, plus a configurable slot count for the mosaic.

## Problem

Previously, the homepage pulled the 12 most recent completed public animations for both the grid section and the hero mosaic. There was no way to curate — whatever was generated last showed up. A bad animation or test generation would immediately appear on the marketing homepage.

## Solution

Two boolean columns on the `animations` table:

- `is_featured` — controls the "AI Animated Clip Art" grid section below the fold
- `is_mosaic` — controls which animations appear as video tiles in the hero mosaic

Plus a `mosaic_animation_slots` setting (stored in `site_settings`) that caps how many mosaic-flagged animations actually render.

An animation can be in both, either, or neither. Full independent control.

## Database Schema

```sql
ALTER TABLE public.animations ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.animations ADD COLUMN is_mosaic boolean NOT NULL DEFAULT false;

-- Partial indexes for fast homepage queries
CREATE INDEX idx_animations_featured ON public.animations(is_featured) WHERE is_featured = true;
CREATE INDEX idx_animations_mosaic ON public.animations(is_mosaic) WHERE is_mosaic = true;
```

The `site_settings` table stores homepage config under key `homepage_config`:

```json
{ "mosaic_animation_slots": 6 }
```

## Admin Interface

Accessible at `/admin/animations` (admin-only, gated by `profiles.is_admin`).

### Mosaic Config Panel

Top of the page. Shows current count of mosaic-flagged animations vs the max slot setting. Number input (0-20) with save button.

### Animations Table

Lists all completed animations with:

| Column | Description |
|--------|-------------|
| Image | Source generation thumbnail (40x40) |
| Prompt | Truncated prompt text + source title |
| Model | Kling model variant |
| Date | Creation date |
| Featured | Toggle switch (pink when on) — controls grid section |
| Mosaic | Toggle switch (purple when on) — controls hero |

Rows with either flag active get a subtle amber highlight. Featured and mosaic animations sort to the top. Optimistic UI updates with rollback on failure.

## Homepage Behavior

Two independent queries run in `Promise.all`:

1. `getFeaturedAnimations()` — `is_featured = true`, limit 12. Falls back to latest 12 if none are featured.
2. `getMosaicAnimations()` — `is_mosaic = true`, limit 20. Sliced to `mosaic_animation_slots` count. Falls back to latest 6 if none are flagged.

Graceful degradation means the homepage always shows animations even before any are curated — it just uses the latest ones as a fallback.

## API Routes

### `GET /api/admin/animations`

Returns paginated list of completed animations with source generation join. Ordered by `is_featured DESC, is_mosaic DESC, created_at DESC`.

Query params: `limit` (default 50, max 100), `offset` (default 0).

### `PATCH /api/admin/animations`

Toggle flags on a specific animation.

```json
{ "id": "uuid", "is_featured": true }
{ "id": "uuid", "is_mosaic": false }
{ "id": "uuid", "is_featured": true, "is_mosaic": true }
```

### `GET /api/admin/settings/homepage`

Returns homepage config. Default: `{ "mosaic_animation_slots": 6 }`.

### `PUT /api/admin/settings/homepage`

Update mosaic slot count. Body: `{ "mosaic_animation_slots": 8 }`. Validated to 0-20 range.

## Files

| File | Role |
|------|------|
| `db/add-animation-featured.sql` | Migration adding `is_featured` and `is_mosaic` columns |
| `app/api/admin/animations/route.ts` | Admin API for listing and toggling animation flags |
| `app/api/admin/settings/homepage/route.ts` | Admin API for mosaic slot count |
| `app/admin/animations/page.tsx` | Admin UI with toggles and config |
| `app/admin/layout.tsx` | Added "Animations" nav link |
| `app/page.tsx` | Homepage now runs two independent queries + reads slot config |
