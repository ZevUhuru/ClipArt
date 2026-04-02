# BUG-001: Pages Show Empty State for Authenticated Users

**Status**: Resolved
**Severity**: Critical (users cannot access their own content)
**Affected Pages**: `/my-art`, `/edit`, `/animate`
**Date**: April 2026

## Symptoms

- Logged-in user sees "No images yet" / "No creations yet" on My Creations, Edit, and Animate pages
- User is clearly authenticated (credits shown, sign-out visible)
- No errors in console or network tab — queries return 200 with empty arrays

## Root Cause

All three pages queried the `generations` table using the **browser Supabase client** with `.eq("user_id", user.id)`. This relies on Supabase's Row Level Security (RLS) policy `auth.uid() = user_id`.

Two interacting failures:

1. **Race condition**: Zustand `user` state starts as `null`. Page effects run before `Providers` finishes auth initialization, prematurely showing the empty state.

2. **Silent RLS failure**: Even after the user state loads, `auth.uid()` can return `NULL` if the browser client's auth session cookies are stale, expired, or mid-refresh. RLS returns **empty results** (not errors) when the policy doesn't match — indistinguishable from "user has no data."

## Fix

Replaced direct browser-to-Supabase queries with a server API route (`/api/me/images`):

1. **Server verifies auth** via `createSupabaseServer()` (reads HTTP cookies reliably)
2. **Admin client queries DB** via `createSupabaseAdmin()` (bypasses RLS with service role key)
3. Pages `fetch("/api/me/images")` instead of querying Supabase directly

## Commits

- `461efd0` — Fix for Edit/Animate pages (workspace refactor + `/api/me/images` route)
- `b1cf742` — Fix for My Creations page (expanded route with filter/pagination params)

## Lesson

RLS failures are silent by design. Never rely on the browser Supabase client for authenticated data fetching in pages where empty results and auth failures are indistinguishable. Verify auth server-side, query with the admin client.

See: [Study Guide — RLS & Auth Architecture](../study/rls-and-auth-architecture.md)
