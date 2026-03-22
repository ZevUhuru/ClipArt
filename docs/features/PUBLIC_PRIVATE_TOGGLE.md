# Public / Private Generation Toggle

**Date:** 2026-03-22
**Status:** Shipped

## Overview

Users can choose whether their generated clip art is shared with the community or kept private. The toggle defaults to **ON** (public), supporting the content flywheel while giving users transparent control.

## Behavior

| Toggle state | `is_public` | Visible in search/community | Gets SEO detail page | Visible in "My Clip Art" |
|--------------|-------------|------------------------------|----------------------|--------------------------|
| Public (ON)  | `true`      | Yes                          | Yes                  | Yes                      |
| Private (OFF)| `false`     | No                           | No                   | Yes                      |

- Default: **Public (ON)**
- The toggle sits inline with the style pills on `/create`, right-aligned
- Private generations skip `revalidatePath` since there's no public page to update

## Why default to public

The clip.art flywheel depends on user-generated content becoming discoverable:

1. User generates clip art → image is public
2. Public image gets indexed by Google → organic traffic
3. New visitors discover the site → some become users
4. Repeat

Defaulting to public keeps this flywheel spinning while the toggle ensures transparency — users always know what happens to their images before generating.

## Files changed

| File | Change |
|------|--------|
| `app/(app)/create/page.tsx` | Added `isPublic` state (default `true`), toggle UI, passes value to API |
| `app/api/generate/route.ts` | Reads `isPublic` from request body, uses `isPublic !== false` for backwards compatibility, conditionally skips revalidation for private images |

## API contract

The `/api/generate` endpoint now accepts an optional `isPublic` field:

```json
{
  "prompt": "a happy sun",
  "style": "flat",
  "isPublic": true
}
```

- If `isPublic` is omitted or `true`: generation is public (backwards-compatible)
- If `isPublic` is `false`: generation is private

## Future considerations

- **Tier gating**: Could lock the private toggle behind paid credits only (free credits always public)
- **Retroactive toggle**: Let users change visibility of existing generations from "My Clip Art"
- **Disclosure copy**: Add a subtle line during onboarding: "Free generations are shared with the community"
