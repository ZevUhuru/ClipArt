# OPT-002: Community API Server-Side Caching

**Area**: Data fetching
**Page**: `/create` (Community Creations section)
**Date**: April 2026

## Before

The `CommunityGrid` component fetched community content by making **client-side Supabase queries** directly from the browser. Every page load triggered:

1. Browser Supabase client initialization (auth token exchange)
2. Direct query to Supabase Postgres for recent public generations
3. Second query for recent public animations
4. All queries were uncached — every visitor hit the database

For a page that shows the same community content to all visitors, this meant N database round-trips for N visitors within any time window.

## After

Introduced a server-side API route (`/api/community`) that:

1. Uses `createSupabaseAdmin` to bypass RLS (community content is public)
2. Returns both generations and animations in a single response
3. Sets `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` headers

```
Before: Browser → Supabase (auth) → Postgres → Browser (per visitor)
After:  Browser → /api/community → CDN cache (30s) → Supabase admin → Postgres
```

**How the cache layers work:**

| Layer | TTL | Behavior |
|-------|-----|----------|
| Vercel Edge Cache | 30s (`s-maxage`) | Serves cached response to all visitors |
| Stale-while-revalidate | 60s | Serves stale while fetching fresh in background |
| No cache | After 90s | Full round-trip to Supabase |

## Impact

- **Database queries**: Reduced from N (per visitor) to ~1 per 30 seconds regardless of traffic
- **Latency**: ~50ms (cached CDN) vs ~200-400ms (client-side Supabase auth + query)
- **Auth overhead**: Eliminated — admin client needs no per-user auth token exchange
- **RLS complexity**: Bypassed — community content is public by definition

## Files Changed

| File | Change |
|------|--------|
| `app/api/community/route.ts` | New server-side API route with admin client and cache headers |
| `app/(app)/create/page.tsx` | `CommunityGrid` fetches from `/api/community` instead of direct Supabase |
