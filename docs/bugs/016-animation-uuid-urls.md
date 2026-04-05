# Bug 016 — Animation detail pages showing UUID URLs instead of slugs

**Status:** Fixed  
**Date:** 2026-04-04  
**Severity:** SEO / UX (P2)

## Symptom

Animation detail pages were accessible at raw UUID URLs like
`/animations/70e31e55-e822-49c6-a448-1cd86158b065` instead of clean
slugs like `/animations/polynesian-girl-on-bus-70e31e55`.

Two different URLs existed simultaneously:
- `/animations` index page linked to the correct slug URL
- My Creations (app drawer) linked to the UUID URL

Both resolved to the same page because the server component falls back
from slug lookup to ID lookup, but the duplicate URLs are bad for SEO
and user experience.

## Root Causes

### 1. Backfill migration had a Postgres regex issue

The original `db/add-animation-slugs.sql` used `\s` inside a POSIX
character class:

```sql
regexp_replace(text, '[^a-zA-Z0-9\s-]', '', 'g')
```

In PostgreSQL's POSIX regex engine, `\s` inside `[...]` can behave
unexpectedly — spaces may be stripped instead of preserved, producing
concatenated slugs with no hyphens, or the update may silently produce
no changes.

**Fix:** Replaced with literal space: `'[^a-zA-Z0-9 -]'` in
`db/backfill-animation-slugs.sql`.

### 2. No slug generated at animation creation time

`/api/animate/route.ts` inserted animations without a `slug` field.
The slug was only set by the one-time backfill migration, so any
animation created after the migration ran had `slug = NULL`.

**Fix:** Added slug generation at insert time:

```typescript
const slugBase = (sourceGen?.title || prompt)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 60);
const slugSuffix = crypto.randomUUID().slice(0, 8);
const slug = `${slugBase}-${slugSuffix}`;
```

### 3. Stale client data after backfill

The My Creations page fetches animation data client-side. The drawer
builds the detail URL as `/animations/${image.slug}` where `image.slug`
comes from the Zustand store, set by:

```typescript
slug: anim.slug || anim.source_slug || anim.id
```

When `anim.slug` is `null` (data fetched before the backfill), it falls
through to `anim.source_slug` (the source generation's clipart slug,
which is wrong for the `/animations/` route) or `anim.id` (the UUID).

**Fix:** This is a transient issue — a hard refresh re-fetches from the
API which now returns the backfilled slugs.

## Data Flow

```
/api/me/images?filter=animations
  → Supabase: animations.slug (animation's own slug)
  → Supabase: source.slug (source generation's clipart slug)

my-art page mapping:
  anim.slug = row.slug         → "polynesian-girl-on-bus-70e31e55"
  anim.source_slug = src.slug  → "polynesian-girl-on-bus" (clipart slug)

Drawer slug fallback chain:
  anim.slug || anim.source_slug || anim.id
  ↓
  /animations/${slug}
```

The `/animations` index page correctly uses `a.slug || a.id` from the
server-rendered query, which gets the right slug after ISR revalidation
(60 second cache).

## Files Changed

- `app/api/animate/route.ts` — generate slug at insert time
- `db/backfill-animation-slugs.sql` — new robust backfill with
  Postgres-safe regex (safe to re-run)

## Lesson

Always generate URL slugs at record creation time, not just via
one-time backfill migrations. Backfill scripts are for existing data;
the insert path must also produce slugs. Also, use literal characters
instead of shorthand escapes (`\s`, `\d`) inside POSIX character classes
in PostgreSQL regex.
