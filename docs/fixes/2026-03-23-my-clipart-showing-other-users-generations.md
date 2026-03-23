# Fix: My Clipart Showing Other Users' Generations

**Date:** 2026-03-23
**Severity:** Medium — wrong data displayed, no data loss

## Problem

The "My Clip Art" page and the "Recents" section on the Create page were showing generations from all users, not just the signed-in user's own work. A user would sign in and see dozens of images they never created mixed in with their own.

## Root Cause

The Supabase queries in `HistoryGrid` and `RecentsGrid` fetched from the `generations` table without an explicit `user_id` filter:

```typescript
const { data } = await supabase
  .from("generations")
  .select("id, image_url, prompt, style, category, slug, created_at")
  .order("created_at", { ascending: false })
  .limit(50);
```

The assumption was that Row Level Security (RLS) would scope results to the current user. There is an RLS policy for that:

```sql
CREATE POLICY "Users read own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);
```

However, a second permissive policy was added later for the public gallery feature:

```sql
CREATE POLICY "Public can read public generations"
  ON public.generations FOR SELECT
  USING (is_public = true);
```

Postgres combines multiple **permissive** SELECT policies with OR, meaning a signed-in user matched rows where `auth.uid() = user_id` **OR** `is_public = true`. The result: the user's own generations plus every public generation from every other user.

## Fix

### 1. Explicit `user_id` filter on both queries

Added `.eq("user_id", user!.id)` to the Supabase queries in:

- `src/components/HistoryGrid.tsx` (My Clip Art page)
- `app/(app)/create/page.tsx` (RecentsGrid on the Create page)

```typescript
const { data } = await supabase
  .from("generations")
  .select("id, image_url, prompt, style, category, slug, created_at")
  .eq("user_id", user!.id)
  .order("created_at", { ascending: false })
  .limit(50);
```

The `user!` non-null assertion is safe because both components have an early `if (!user) return` guard in the enclosing `useEffect`. TypeScript can't narrow across the nested closure boundary, so the assertion is needed to satisfy the compiler.

### 2. Community tab on Create page

With Recents now scoped to the user only, a new "Community" tab was added alongside "Recents" on the Create page so users can still browse public generations. This fetches with `.eq("is_public", true)` instead of `user_id`.

The rendering logic was refactored into a shared `GenerationGrid` component used by both tabs.

## Lesson

When relying on RLS for data scoping, be aware that adding new permissive policies widens the result set via OR. If a view must be strictly user-scoped, always include an explicit filter in the application query rather than relying solely on RLS. RLS remains a safety net, but the app query should express the intended scope.

## Files Changed

- `src/components/HistoryGrid.tsx` — added `.eq("user_id", user!.id)`
- `app/(app)/create/page.tsx` — added user_id filter to RecentsGrid, added CommunityGrid component, added Recents/Community tab switcher, extracted shared GenerationGrid component
