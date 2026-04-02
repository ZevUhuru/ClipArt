# Row Level Security & Auth Architecture

## The Problem

Three pages — My Creations (`/my-art`), Edit (`/edit`), and Animate (`/animate`) — all showed empty states for logged-in users. The user was clearly authenticated (sidebar showed credits and a sign-out button), but their images wouldn't load. The pages displayed "No images yet" or "No creations yet" as if they had never generated anything.

This wasn't a one-off bug. The same failure pattern hit three different pages independently, which tells you the root cause is architectural, not a typo.

---

## The Concept: How Authentication Works in a Supabase + Next.js App

To understand why this broke, you need to understand how authentication flows through a stack with **three** players: the browser, the Next.js server, and Supabase.

### The Three Clients

In a Supabase + Next.js app, you have three different ways to talk to the database:

```
1. Browser Client    → Uses anon key + user's auth cookies → Subject to RLS
2. Server Client     → Uses anon key + forwarded cookies   → Subject to RLS
3. Admin Client      → Uses service role key               → Bypasses RLS entirely
```

**Row Level Security (RLS)** is Supabase's way of enforcing who can see what at the database level. When enabled on a table, every query must pass a policy check. No policy match = no rows returned (silently — no error, just empty results).

### How RLS Policies Work

Our `generations` table has this policy:

```sql
CREATE POLICY "Users read own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);
```

This means: "A user can only SELECT rows where the `user_id` column matches their authenticated identity." The function `auth.uid()` returns the UUID of the currently authenticated user — but only if Supabase can verify the user's session.

### The Auth Chain

For `auth.uid()` to return a value in the browser client, this chain must hold:

```
1. User logs in via Supabase Auth → Auth cookies set in browser
2. Browser Supabase client reads cookies from document.cookie
3. Client sends cookies in request to Supabase API
4. Supabase verifies JWT in cookie → auth.uid() returns the user's UUID
5. RLS policy evaluates → rows returned
```

If **any** link in this chain breaks — cookies expired, not forwarded correctly, domain mismatch, timing issue — `auth.uid()` returns `NULL`, the policy evaluates to `FALSE` for every row, and you get **zero results with no error**.

This is the insidious part: **RLS failures are silent**. The query succeeds. It just returns nothing.

---

## The Specific Bug: A Race Condition + Silent Failure

Our pages had two interacting problems:

### Problem 1: Zustand vs. Supabase Session Timing

The app uses Zustand for global state. On mount, the `Providers` component does:

```
1. Create browser Supabase client
2. Call supabase.auth.getUser() (async — takes time)
3. If user found → setUser({ id, email }) in Zustand store
```

Meanwhile, our page components run their own effects:

```
1. Component mounts
2. useEffect checks Zustand's `user` — it's null (Providers hasn't finished yet)
3. Sets loading = false, shows empty state
4. Eventually user arrives in Zustand, effect re-runs
5. Query fires... but may still fail (see Problem 2)
```

The `loading` state was set to `false` prematurely on step 3. Even when the effect re-ran in step 4, the empty state was already visible and the loading indicator wasn't shown again because `setLoading(true)` wasn't called on retry.

### Problem 2: Browser Client Auth Session Fragility

Even when the Zustand store had the user and the query fired, it used `createBrowserClient()` which creates a fresh Supabase client instance. This client reads auth cookies from `document.cookie`. If:

- The auth cookies haven't been refreshed
- The JWT has expired between page loads
- Cookie SameSite/domain settings don't match
- The session refresh is still in-flight

...then `auth.uid()` returns `NULL` in the RLS check, and the query silently returns empty results.

### Why It Was Intermittent

This bug didn't happen 100% of the time:
- **Fast connections**: Providers finished quickly, cookies were fresh → worked
- **Slow connections**: Race condition hit, cookies stale → failed
- **First visit after login**: Cookies fresh → worked
- **Later visits**: Cookies might be near expiry → failed silently

---

## The Options

### Option A: Fix the Race Condition in the Components

Add `setLoading(true)` when user changes, wait for Supabase auth to settle before querying.

**Pros**: Minimal change, keeps existing architecture.
**Cons**: Doesn't fix the fundamental RLS fragility. Still depends on browser cookies being in the right state. Every new page that needs user data would need the same careful handling.

### Option B: Server API Route with Admin Client

Move the query behind a Next.js API route. The route:
1. Uses `createSupabaseServer()` to verify auth from the request cookies
2. If valid, queries with `createSupabaseAdmin()` which bypasses RLS entirely
3. Returns the data

```
Browser → /api/me/images → Server verifies auth → Admin queries DB → Returns data
```

**Pros**: Auth verification is reliable (server reads cookies directly from the HTTP request, no JavaScript timing). Admin client bypasses RLS so the query always returns data for verified users. Single pattern for all authenticated data fetching. Can add caching headers.
**Cons**: Extra network hop (browser → server → DB instead of browser → DB). Slightly more code to maintain.

### Option C: Fix RLS Policies to Be More Permissive

Add broader RLS policies or switch to a public access pattern.

**Pros**: Browser queries would work without auth.
**Cons**: Security disaster. User data would be exposed. Not an option.

---

## What We Chose & Why

**Option B: Server API route with admin client.**

The reasoning:

1. **Reliability over simplicity.** The browser client auth chain has too many moving parts that can fail silently. A server-side auth check is a single, well-tested code path.

2. **One pattern for everything.** We already had `/api/community` doing this for public data. Extending the pattern to authenticated data means every page follows the same architecture: fetch from an API route, never query Supabase directly from the browser.

3. **Defense in depth.** The admin client bypasses RLS, but the API route itself checks auth. So security comes from the API layer (which we control) rather than the database layer (which has silent failure modes).

4. **Extensibility.** The `/api/me/images` route easily grew to support `?filter=`, `?offset=`, and `?limit=` params, serving both the simple import modal and the complex paginated My Creations page from a single endpoint.

---

## Code Walkthrough

### The API Route

```typescript
// app/api/me/images/route.ts
export async function GET(req: NextRequest) {
  // Step 1: Verify the user is who they say they are
  const supabase = await createSupabaseServer();  // Reads cookies from HTTP request
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ images: [] }, { status: 401 });
  }

  // Step 2: Query with admin client (bypasses RLS)
  const admin = createSupabaseAdmin();  // Uses service role key
  const { data } = await admin
    .from("generations")
    .select("...")
    .eq("user_id", user.id)  // We verified this user exists
    .order("created_at", { ascending: false });

  return NextResponse.json({ images: data || [] });
}
```

Key insight: `createSupabaseServer()` verifies auth from the **HTTP request cookies** (reliable), while `createSupabaseAdmin()` queries with the **service role key** (bypasses RLS). The auth check and the data query are decoupled — each uses the most reliable mechanism for its job.

### The Client Component

```typescript
// Before (broken):
const supabase = createBrowserClient();
const { data } = await supabase
  .from("generations")
  .eq("user_id", user.id)  // Depends on auth.uid() matching in RLS

// After (reliable):
const res = await fetch("/api/me/images?filter=all&offset=0&limit=60");
const { images } = await res.json();
```

The component no longer needs to know about Supabase, RLS, or auth sessions. It just fetches from an API.

---

## Mental Model: The Auth Verification Pyramid

When building authenticated data access, think in layers:

```
            ┌─────────────────┐
            │  UI shows data  │  ← What the user sees
            ├─────────────────┤
            │  API returns it │  ← Server verified the request
            ├─────────────────┤
            │ Auth middleware  │  ← Cookies/tokens checked server-side
            ├─────────────────┤
            │  Admin DB query │  ← Service role, no RLS ambiguity
            └─────────────────┘
```

**Rule of thumb**: Never trust the browser to maintain its own auth state for data queries. Verify auth on the server, then query with elevated privileges. The browser's job is to *present* data and *send* credentials — not to *enforce* access control.

### When to Use Each Client

| Client | Use For | Auth | RLS |
|--------|---------|------|-----|
| Browser (`createBrowserClient`) | Real-time subscriptions, auth state changes | Cookie-based, fragile | Yes |
| Server (`createSupabaseServer`) | Verifying who's logged in | HTTP cookies, reliable | Yes |
| Admin (`createSupabaseAdmin`) | Actually querying data after auth is verified | Service role key | **Bypassed** |

### The Silent Failure Principle

**If a system can fail silently, it will — and you won't know until a user reports it.**

RLS returns empty results instead of errors. This is by design (prevents information leakage), but it means you can't distinguish "user has no data" from "auth is broken" by looking at the response. Always prefer systems where failures are explicit (an API returning 401) over systems where failures look like success (an empty result set).

---

## Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) — How policies work, common patterns
- [Supabase SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — Cookie handling in Next.js
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) — Server API routes
- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — Why silent auth failures are a security concern
