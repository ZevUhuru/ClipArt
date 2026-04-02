# Data Fetching & Caching

## The Problem

The community grid on `/create` had a noticeable loading delay. Users would see skeleton placeholders for 1-3 seconds before any images appeared. On slower connections or cold starts, it was worse.

We needed to make it feel instant.

---

## The Concept: Where You Fetch Data Changes Everything

Every web application needs to get data from somewhere (a database, an API, a file) and show it to users. The **where**, **when**, and **how often** you fetch that data has a massive impact on how fast your app feels.

There are three fundamental places data can be fetched:

### 1. On the Server, Before the Page Arrives

```
User requests page → Server fetches data → Server builds HTML with data → HTML arrives with content ready
```

The user never sees a loading state. The page arrives complete. This is **server-side rendering (SSR)** or **static generation (SSG)**. It's the fastest perceived experience because there's no second round trip.

**Tradeoff**: The server has to do work before responding, which adds latency to the initial page load (Time to First Byte). And if the page has interactive client-side state (like a prompt input, style picker, etc.), you need to carefully split what's server-rendered and what's client-rendered.

### 2. On the Client, After the Page Arrives

```
User requests page → Page arrives (empty/skeleton) → JavaScript loads → JavaScript fetches data → Page fills in
```

This is what we were doing. The page arrives fast but *empty*. Then there's a **waterfall**: the browser has to download JavaScript, parse it, execute it, make a network request to the database, wait for the response, and then render. Each step depends on the previous one completing.

This is **client-side rendering (CSR)**. It's the simplest to implement but the slowest to show content, because you're serializing multiple network round trips.

**Tradeoff**: Easy to build, works well for highly interactive apps where the page shell is usable before data loads (like a chat app). Bad for content-heavy pages where users come specifically to *see* the content.

### 3. On an Edge/CDN, Pre-Cached

```
User requests page → CDN has cached response → Instant delivery (< 50ms)
```

If the data doesn't change every second, you can cache it. A CDN (Content Delivery Network) stores copies of responses at servers around the world, physically close to your users. When a request comes in, the nearest server can respond immediately without ever hitting your database.

**Tradeoff**: The data might be slightly stale. Users might see content that's 30 seconds old instead of up-to-the-millisecond fresh. For something like a community gallery, this is perfectly fine. For something like a bank balance, it's not.

---

## The Options We Had

### Option A: Keep Direct Browser → Supabase Calls

```
Browser → Supabase REST API (external server) → RLS policy check → Query → Response → Browser
```

**What it was**: The `CommunityGrid` component used Supabase's browser client to query the database directly from the user's browser.

**Pros**:
- Simple — one line of code to query
- Always fresh data
- No backend route to maintain

**Cons**:
- **Slow**: Two separate queries (generations + animations) from the user's browser to an external API
- **No caching**: Every single page visit makes two fresh database queries
- **RLS overhead**: Row-Level Security policies are evaluated for every row on every query. RLS is essential for user-specific data (like "show me MY images"), but for public data where every user sees the same thing, it's unnecessary work
- **Exposed query logic**: The browser knows your table names, column names, and query structure
- **Double waterfall**: Page loads → JS hydrates → Supabase SDK initializes → Two parallel queries fire → Data arrives

### Option B: Server API Route with Caching (What We Chose)

```
Browser → Your API route (same origin) → Server queries DB (admin, no RLS) → Cached response
```

**What it is**: A `/api/community` endpoint that runs on your server, queries the database with an admin client, and returns the combined result with cache headers.

**Pros**:
- **Single request** from browser (one fetch instead of two Supabase calls)
- **Same-origin**: No CORS, lower latency than cross-origin Supabase calls
- **CDN-cacheable**: `s-maxage=30, stale-while-revalidate=60` means most users get an instant cached response
- **Admin client**: Skips RLS evaluation (faster for public reads)
- **Simpler client code**: `fetch("/api/community")` vs two Supabase query chains

**Cons**:
- Data can be up to 30 seconds stale (acceptable for a community gallery)
- One more API route to maintain
- If the server is down, the endpoint is down (Supabase direct would still work)

### Option C: Full Server-Side Rendering

Make `/create` a server component that fetches data before sending HTML.

**Pros**:
- No loading state at all — page arrives with content
- Best for SEO

**Cons**:
- The `/create` page is heavily interactive (prompt input, style picker, generation state, Zustand stores). It **must** be a client component (`"use client"`). Converting it to a server component would require splitting it into a server wrapper + client children — a significant refactor.
- Every page navigation would re-fetch on the server, adding latency to TTFB

This is the right approach for marketing pages (and we use it on the homepage), but it's not practical for app pages with heavy client-side state without a bigger refactor.

### Option D: React Server Components with Suspense Streaming

Wrap the data-fetching part in a server component with `<Suspense>` boundaries, streaming the shell immediately and filling in the grid when data arrives.

**Pros**:
- Best of both worlds — instant page shell, server-fetched data, no client-side waterfall
- No API route needed

**Cons**:
- Requires refactoring the entire page architecture to split server and client boundaries
- More complex component tree
- Overkill for this specific fix when Option B solves it with minimal changes

---

## What We Chose & Why

**Option B** — the cached API route. Here's the reasoning:

1. **Minimal change, maximum impact**: Two files changed. The grid went from a multi-second load to near-instant for most users.
2. **The data is inherently public and shared**: Every user sees the same community grid. There's no reason to query fresh every time. 30-second staleness is imperceptible.
3. **The page architecture stays simple**: No need to refactor the client component tree. We just changed where the data comes from.
4. **Composable**: Other pages can now use `/api/community` too (the `/create/coloring-pages` page, for example).

---

## Code Walkthrough

### The API Route

```typescript
// app/api/community/route.ts

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createSupabaseAdmin();  // ← Admin client, skips RLS

  const [genResult, animResult] = await Promise.all([
    admin.from("generations").select("...").eq("is_public", true).limit(50),
    admin.from("animations").select("...").eq("is_public", true).limit(8),
  ]);

  return NextResponse.json(
    { generations: genResult.data, animations: animResult.data },
    {
      headers: {
        // CDN caches for 30s, serves stale for 60s while revalidating
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
```

Key decisions:
- **`force-dynamic`**: Tells Next.js this route always runs server-side (not statically generated at build time). We want it dynamic because the data changes.
- **`createSupabaseAdmin()`**: Uses the service role key, which bypasses Row-Level Security. Safe here because we're explicitly filtering to `is_public = true` in the query itself.
- **`Promise.all`**: Both queries run in parallel. This is faster than running them sequentially.
- **`s-maxage=30`**: The CDN (Vercel's edge network) caches this response for 30 seconds. During that window, users worldwide get the cached response instantly without hitting your server at all.
- **`stale-while-revalidate=60`**: After the 30-second cache expires, the CDN **still serves the stale response** immediately to the user, but kicks off a background refresh. The next user after the refresh completes gets fresh data. This means users almost never wait for a fresh fetch.

### The Client Component

```typescript
// Before: two direct Supabase calls
const supabase = createBrowserClient();
const [genResult, animResult] = await Promise.all([
  supabase.from("generations").select("..."),
  supabase.from("animations").select("..."),
]);

// After: single fetch to our cached API
const res = await fetch("/api/community");
const { generations, animations } = await res.json();
```

The merge logic (interleaving animations into the grid) stayed exactly the same — it was extracted into a `mergeAnimations()` helper for clarity.

---

## Mental Model: The Caching Decision Framework

When deciding how to fetch and cache data, ask these questions in order:

### 1. Is this data the same for every user?

- **Yes** → You can cache aggressively. CDN caching, static generation, revalidation.
- **No** → You need per-user fetching. Consider server-side with auth, or client-side with tokens.

### 2. How fresh does it need to be?

- **Real-time** (chat, stock prices, notifications) → WebSockets or client-side polling. No caching.
- **Near-real-time** (social feeds, dashboards) → Short cache (5-30 seconds) with stale-while-revalidate.
- **Eventually consistent** (blog posts, galleries, product pages) → Longer cache (60s-5min) or ISR.
- **Static** (docs, marketing pages) → Build-time generation, revalidate on deploy.

### 3. Where does the user feel the latency?

- **On page load** → Server-render or pre-cache
- **On interaction** (clicking a tab, filtering) → Client-side fetch is fine; the page shell is already there
- **Never** (background sync) → Fetch whenever, update silently

### 4. What's the cost of staleness?

- **High** (financial data, auth state) → Always fetch fresh
- **Medium** (user profile, settings) → Cache briefly, invalidate on mutation
- **Low** (public galleries, trending lists) → Cache aggressively

For our community grid: same for every user, near-real-time freshness is fine, latency is felt on page load, cost of staleness is very low. That's a textbook case for server-side caching with stale-while-revalidate.

---

## The Cache-Control Header, Explained

```
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
```

This one header does a lot. Here's what each directive means:

| Directive | Meaning |
|-----------|---------|
| `public` | Any cache can store this (CDN, browser, proxy). Use `private` for user-specific data. |
| `s-maxage=30` | **Shared caches** (CDNs) should consider this response fresh for 30 seconds. The `s-` means it only applies to shared/proxy caches, not the user's browser. |
| `stale-while-revalidate=60` | After `s-maxage` expires, the cache can serve the stale response for up to 60 more seconds while fetching a fresh one in the background. |

**Timeline of what happens:**

```
t=0s    → Response cached. CDN serves it instantly.
t=0-30s → CDN serves cached response. No server hit.
t=30s   → Cache "expires" but SWR kicks in.
t=30-90s → CDN serves stale response instantly, fetches fresh in background.
t=90s   → If no refresh happened, cache is truly expired. Next request hits server.
```

In practice, for a popular page, the cache almost never fully expires because requests keep triggering background refreshes.

---

## RLS vs Admin Client: When to Use Which

**Row-Level Security (RLS)** is a Postgres feature that automatically filters rows based on the current user's identity. It's enforced at the database level, so even if your application code has a bug, unauthorized data doesn't leak.

**When to use the anon/user client (RLS enforced)**:
- User-specific data: "Show me my images," "Update my profile"
- Mutations: Inserts, updates, deletes should always go through RLS
- Any query where the result depends on who's asking

**When to use the admin/service role client (RLS bypassed)**:
- Public data that's the same for everyone: community galleries, featured content
- Server-side only (never expose the service role key to the browser)
- Background jobs, webhooks, admin operations
- When you need performance and you're filtering in the query anyway

In our case, we query `WHERE is_public = true` explicitly. RLS would do the same check, but with additional overhead (policy evaluation on every row). Since we're already on the server with a trusted codebase, skipping RLS is safe and faster.

---

## Further Reading

- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) — The authoritative reference for HTTP caching directives
- [Vercel: Caching](https://vercel.com/docs/edge-network/caching) — How Vercel's CDN handles cache headers
- [web.dev: Stale-while-revalidate](https://web.dev/stale-while-revalidate/) — Deep dive into the SWR pattern
- [Next.js: Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) — Server components, route handlers, and caching in Next.js
- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) — How RLS works and when to use it
