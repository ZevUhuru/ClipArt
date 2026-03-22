# Animations Feature (Internal-First)

**Date:** 2026-03-22
**Status:** Idea / Not started

## Concept

Build animation generation for personal use first (with daughter), expose a public gallery at `/animations` before opening generation to users.

## Architecture

### What users see
- `clip.art/animations` — public gallery of animated clip art. Video grid, auto-play on hover, categories. No generation UI. Builds SEO and demand.

### What admin sees
- Animation generation added to `/admin` panel (already auth-gated)
- Pick a clip art image (existing generation or upload)
- Write a motion prompt
- Send to Kling AI 3.0 API
- Video stored in R2, metadata in DB

### Database
- New `animations` table: `id`, `source_generation_id` (optional link to original clip art), `video_url`, `title`, `prompt`, `motion_prompt`, `category`, `slug`, `is_public`, `created_at`

### Pipeline
1. Select source clip art image
2. Write motion prompt (e.g. "hippo splashes in water, letters fall into hands")
3. Call Kling AI 3.0 API
4. Receive video, optimize/convert, upload to R2
5. Save to `animations` table
6. Appears on `/animations` gallery

## Why admin-gated first
- Admin panel already exists and is protected
- Can manage/delete/edit from same CMS
- When ready to go public, just build generation UI — gallery and storage already work

## SEO opportunity
- "animated clip art" has minimal competition
- Each animation gets its own detail page with the source clip art
- Cross-link between static and animated versions

## Future: Public generation
- Gate behind higher credit cost (e.g. 5 credits per animation vs 1 for image)
- Add to app shell as `/create/animate` tab
- Same public/private toggle as images
