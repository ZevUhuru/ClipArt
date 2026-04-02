# Rendering Strategies

## The Problem

Throughout building clip.art, we've had to decide *how* each page gets built and delivered. The homepage is a server component. The `/create` page is a client component. The `/animations` page is server-rendered. Why? What determines the right choice?

---

## The Concept: Four Ways to Build a Page

Every page on a website ultimately becomes HTML that a browser displays. The question is: **where and when does that HTML get constructed?**

### 1. Static Site Generation (SSG)

```
Build time → HTML files generated → CDN serves files → User gets pre-built page
```

The page is built once, at deploy time. Every user gets the exact same HTML file served from a CDN. Fastest possible delivery.

**When to use it**: Content that rarely changes. Blog posts, documentation, landing pages, marketing copy.

**In clip.art**: The `/learn` blog posts use SSG. They're written in MDX, compiled at build time, and never change until the next deploy.

**Tradeoff**: Content is frozen at build time. To update it, you need to redeploy (or use ISR — see below).

### 2. Incremental Static Regeneration (ISR)

```
Build time → HTML generated → CDN serves it → After X seconds, regenerate in background
```

Like SSG, but the page can be refreshed without a redeploy. You set a `revalidate` interval, and Next.js rebuilds the page in the background after that interval.

**When to use it**: Content that changes periodically but doesn't need to be real-time. Product pages, category listings, homepages.

**In clip.art**: The homepage uses `export const revalidate = 60`. It's statically generated but refreshes every 60 seconds to show new community images.

**Tradeoff**: Data can be up to `revalidate` seconds stale. First visitor after expiration gets the old page (while regeneration happens in the background).

### 3. Server-Side Rendering (SSR)

```
User requests page → Server runs code → Server fetches data → Server builds HTML → User gets complete page
```

Every request triggers a fresh server render. The page always has the latest data.

**When to use it**: Pages where content depends on the request (user auth, query parameters, cookies) and can't be cached.

**In clip.art**: The admin pages use SSR. They check auth on every request and show user-specific data.

**Tradeoff**: Slower Time to First Byte (TTFB) because the server does work before responding. Can't be CDN-cached (unless you add caching yourself).

### 4. Client-Side Rendering (CSR)

```
User requests page → Server sends empty shell (HTML + JS) → Browser runs JS → JS fetches data → Page fills in
```

The server sends a minimal HTML skeleton and a JavaScript bundle. All data fetching and rendering happens in the browser.

**When to use it**: Highly interactive applications where the page shell is immediately useful and data loads progressively. Dashboards, editors, tools.

**In clip.art**: The `/create` page is CSR. It's a full interactive tool (prompt input, style picker, generation state, real-time progress) that needs client-side state management. The page shell (input bar, style pills) renders instantly; the community grid loads shortly after.

**Tradeoff**: Users see loading states. SEO is poor unless you add server-rendering for the initial HTML. Multiple network round trips before content is visible.

---

## Decision Matrix: How We Choose

| Signal | → Strategy |
|--------|-----------|
| Content is the same for all users and rarely changes | SSG |
| Content is the same for all users but changes periodically | ISR |
| Content depends on the request (auth, cookies, params) | SSR |
| Page is highly interactive with complex client state | CSR |
| You need both interactivity AND server-fetched data | Hybrid (server wrapper + client children) |

### The Hybrid Approach

In practice, most pages aren't purely one strategy. Next.js App Router lets you mix them:

```
app/
  page.tsx          ← Server component (fetches data)
  ClientSection.tsx ← "use client" (handles interactivity)
```

The server component fetches data and renders static parts. It passes data as props to client components that handle interactivity. This gives you the best of both worlds: server-fetched data (fast, cacheable, SEO-friendly) with client-side interactivity.

**In clip.art**:
- **Homepage** (`app/page.tsx`): Server component that fetches community images, coloring pages, and animations. Passes them to client components like `Generator` (wrapped in `<Suspense>`).
- **Animations page** (`app/animations/page.tsx`): Server component fetches all animations, passes them to the `AnimationGrid` client component for interactive video playback.

---

## Real Examples from clip.art

### Homepage: ISR (Server Component)

```typescript
// app/page.tsx
export const revalidate = 60;  // Regenerate every 60 seconds

export default async function Home() {
  // These run on the server at build time (or revalidation time)
  const clipArtImages = await getCommunityGallery();
  const animationItems = await getAnimationShowcase();

  return (
    <main>
      <MosaicBackground animations={mosaicAnimations} />  {/* Server → Client prop */}
      <ImageGrid>{/* Pre-rendered images */}</ImageGrid>
      <AnimationGrid animations={...} />  {/* Server → Client prop */}
    </main>
  );
}
```

**Why ISR**: The homepage shows public content that changes slowly (new community images appear every few minutes). ISR gives us instant page loads (cached HTML) with periodic freshness (60-second revalidation). It's also critical for SEO — search engines get fully-rendered HTML.

### /create Page: CSR (Client Component)

```typescript
// app/(app)/create/page.tsx
"use client";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // ... lots of interactive state

  return (
    <div>
      <input value={prompt} onChange={...} />
      <StylePicker />
      <CommunityGrid />  {/* Fetches data client-side via API */}
    </div>
  );
}
```

**Why CSR**: The entire page is interactive. Prompt input, style selection, generation progress, public/private toggle, real-time grid updates from Zustand — all of these require client-side state. Making this a server component would mean splitting it into dozens of tiny pieces, which adds complexity without meaningful benefit since the page is behind the app shell (not crawled by search engines).

### /animations Page: Server Component + Client Grid

```typescript
// app/animations/page.tsx (server)
export default async function AnimationsPage() {
  const animations = await getAnimations();  // Server-side fetch
  return (
    <main>
      <HeroSection />  {/* Static HTML */}
      <AnimationGrid animations={animations} />  {/* Client component for video playback */}
    </main>
  );
}

// app/animations/AnimationGrid.tsx (client)
"use client";
export function AnimationGrid({ animations }) {
  // IntersectionObserver for autoplay, hover interactions, etc.
}
```

**Why hybrid**: The page needs SEO (it's a marketing page). Server-rendering gives us full HTML for search engines. But the video cards need client-side JavaScript for IntersectionObserver-based autoplay and hover interactions. The server fetches the data, the client handles the interactivity.

---

## Mental Model: The Rendering Decision Tree

Ask these questions in order:

### 1. Does this page need to be indexed by search engines?

- **Yes** → Must have server-rendered HTML. Use SSG, ISR, or SSR.
- **No** (it's behind auth, it's an app page) → CSR is fine.

### 2. Does the content change based on who's viewing it?

- **No** (same for everyone) → SSG or ISR. Cache it.
- **Yes, based on the URL** (category pages, search results) → ISR with dynamic params, or SSR.
- **Yes, based on the user** (my images, my settings) → SSR or CSR with auth.

### 3. How interactive is the page?

- **Not very** (reads content, clicks links) → Server component all the way.
- **Moderately** (some buttons, modals) → Server component with small client islands.
- **Heavily** (forms, real-time state, complex UI) → Client component, possibly with server-fetched initial data.

### 4. How often does the data change?

- **Never** (until redeploy) → SSG
- **Every few minutes** → ISR with `revalidate`
- **Every request** → SSR or CSR
- **Real-time** → CSR with WebSockets or polling

---

## The Cost of Each Strategy

Understanding the *cost* (in time) at each phase:

| Strategy | Build Time | Server Time (per request) | Client Time | Perceived Speed |
|----------|-----------|--------------------------|-------------|----------------|
| SSG | Slow (does work upfront) | None (CDN serves file) | Minimal | Fastest |
| ISR | Slow initially, then background | None (cached) / Brief (revalidation) | Minimal | Very fast |
| SSR | None | Every request | Minimal | Medium |
| CSR | None | None (serves JS bundle) | Heavy (fetch + render) | Slowest for content |

The general principle: **move work earlier in the pipeline**. Work done at build time is amortized across all users. Work done on the server is done once per request. Work done on the client is done once per user per visit. The earlier you do it, the fewer times it runs.

---

## Common Mistakes

### 1. Making everything "use client"

Just because a component has one `onClick` handler doesn't mean the whole page needs to be a client component. Extract the interactive part into a small client component and keep the rest server-rendered.

### 2. Fetching public data from the browser

If every user sees the same data, fetch it on the server and cache it. Don't make every browser do the same query independently.

### 3. Not setting cache headers on API routes

If you create an API route that returns public data, add `Cache-Control` headers. Without them, every request hits your server. With them, most requests are served from the CDN in < 50ms.

### 4. Using SSR when ISR would work

SSR runs on every request. ISR runs once and caches. If your data can be 30-60 seconds stale, ISR is dramatically faster and cheaper.

---

## Further Reading

- [Next.js: Rendering](https://nextjs.org/docs/app/building-your-application/rendering) — Official guide to server and client components
- [Next.js: Caching](https://nextjs.org/docs/app/building-your-application/caching) — How Next.js caches at every layer
- [Patterns: Islands Architecture](https://www.patterns.dev/posts/islands-architecture) — The "islands of interactivity" pattern that server/client components implement
- [web.dev: Rendering on the Web](https://web.dev/rendering-on-the-web/) — Google's overview of all rendering strategies with performance implications
