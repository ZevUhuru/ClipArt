# App Shell Scaffold

## Overview

A sidebar-based app shell for clip.art's creator-facing routes (`/create`, `/search`, `/my-art`). Inspired by Craiyon's layout but built with clip.art's light, premium aesthetic. The homepage (`/`) and SEO category pages remain untouched.

**Branch:** `feature/app-shell-scaffold`

## Route Architecture

```
app/
  layout.tsx                    ← Root layout (unchanged)
  page.tsx                      ← Homepage with mosaic BG (unchanged)
  (app)/                        ← Route group — no URL prefix
    layout.tsx                  ← Shared sidebar shell
    create/page.tsx             ← /create (AI generator)
    search/page.tsx             ← /search (browse public clip art)
    my-art/page.tsx             ← /my-art (user's library)
  generator/page.tsx            ← Redirect → /create
  [category]/*                  ← SEO pages (unchanged)
  admin/*                       ← Admin panel (unchanged)
```

## Layout Zones

Two distinct layout experiences serving different stages of the user journey:

- **App shell** (white sidebar + light content): `/create`, `/search`, `/my-art` — for logged-in creators
- **Marketing/content** (CategoryNav + footer-ready): `/`, `/[category]/*`, future `/learn`, `/faq`, etc. — for organic visitors and SEO

These zones are deliberately separate. Category pages are optimized for SEO (rich H1s, content blocks, meta tags). App shell pages are optimized for tool use (compact UI, fast navigation, persistent state). They cross-link to each other but don't share layouts.

## Components

### AppSidebar (`src/components/AppSidebar.tsx`)

White sidebar with clean, premium feel (Linear/Notion style).

- Fixed left, full height, `w-60`, `bg-white`, `border-r border-gray-200`
- **Logo**: Color logo (same as CategoryNav) linking to `/`
- **Nav items**: Create, Search, My Clip Art — with active state via `usePathname()`
- **Get Credits CTA**: Subtle outlined button with amber bolt icon. Opens `BuyCreditsModal` if authenticated, `AuthModal` (signup) if not.
- **Footer**: Credits count in gray pill (when signed in), Sign out. Or Log in / Sign up buttons (when signed out).
- Hidden on mobile (`hidden md:flex`)

Active state: `bg-gray-100 text-gray-900`
Inactive: `text-gray-500 hover:bg-gray-50 hover:text-gray-900`

### AppBottomNav (`src/components/AppBottomNav.tsx`)

Mobile equivalent of the sidebar.

- Fixed bottom, white background, gray border top
- Three tabs matching sidebar nav items
- Active tab: `text-gray-900` with `text-brand-400` icon
- `md:hidden` — only visible on mobile

### App Layout (`app/(app)/layout.tsx`)

Shared layout wrapping all app shell routes:
- Renders `AppSidebar` (desktop) and `AppBottomNav` (mobile)
- Main content area offset by `md:ml-60` with `pb-20 md:pb-0` for mobile bottom nav clearance
- Light gray background: `bg-gray-50`

## Pages

### /create

Compact Craiyon-style generator with community feed.

**Top bar** (sticky, frosted glass):
- Single-line text input + "Create" button (gradient)
- Style pills (Flat, Outline, Cartoon, Sticker, Vintage) below input
- Sticks to top on scroll with `backdrop-blur-xl`

**Content area**:
- Generation result appears as animated card when AI generation completes
- "Community Creations" grid below — loads public clip art from `/api/search?category=free&limit=30`
- Download buttons on community images appear on hover

Generation logic is inlined (not using the `Generator` component) to support the compact layout. Same API calls and store interactions.

### /search

Browse and search public clip art.

- `SearchBar` component at top (centered, max-w-2xl)
- Category tag pills: Christmas, Heart, Halloween, Free, Flower, School, Book, Pumpkin, Cat, Thanksgiving
- **Category slug mapping**: Tags use URL slugs (e.g., `flower`) but the API expects internal DB category names (e.g., `flowers`). The `slugToApiCategory` mapping handles this conversion.
- **Cross-link to SEO pages**: When a category is active, a "Browse all [category] clip art →" link appears, linking to the full SEO category page (e.g., `/flower`). This bridges the app shell and content pages.
- Masonry grid of results with download buttons
- Default view loads "Free" category on mount

### /my-art

User's generation history.

- If not authenticated: centered sign-in prompt with icon, message, and `btn-primary` sign-in button
- If authenticated: full `HistoryGrid` component (fetches from Supabase `generations` table)
- "Create new" CTA linking to `/create`

## Cross-linking Strategy

Category SEO pages and the app shell serve different user journeys but link to each other:

```
Google → /flower (SEO page)
           ↓ "Generate Your Own" CTA
         /create (App shell)
           ↓ sidebar nav
         /search → "Browse all flower clip art →" → /flower
```

- **Category → App shell**: "Generate Your Own" button on every category page links to `/create`
- **App shell → Category**: `/search` category filter shows "Browse all X clip art →" link to the full category page
- **Category pages retain their own layout** (CategoryNav, hero, SEO content blocks) — these are never wrapped in the sidebar shell

## URL Migration

All references to `/generator` have been updated to `/create`:

- `Nav.tsx` — "Create" link
- `CategoryNav.tsx` — "Create" link
- `CategoryPage.tsx` — all CTA links (4 occurrences)
- `ImageDetailPage.tsx` — all CTA links (3 occurrences)
- `app/auth/callback/route.ts` — post-auth redirect
- `app/api/credits/checkout/route.ts` — Stripe success/cancel URLs
- `app/generator/page.tsx` — server-side redirect to `/create`

The `/generator` route still exists as a redirect, so existing bookmarks and external links continue to work.

## Design Decisions

**White sidebar over dark**: The dark sidebar competed with the colorful clip art content and felt heavy. The white sidebar (Linear/Notion style) creates a clean, premium feel where the clip art content is the star. It also matches the light content area for visual cohesion.

**"Get Credits" as subtle CTA**: The gradient neon button was too aggressive — it looked like an ad. The outlined button with the amber bolt icon is noticeable without being obnoxious. It communicates value without pressuring.

**Compact top bar on /create**: The full-card generator layout wasted space and hid the community content below the fold. The Craiyon-style compact bar puts generation front-and-center while filling the page with inspiring community creations.

**Flat routes over nested**: `/create`, `/search`, `/my-art` are top-level routes sharing a layout via a route group, not nested under `/maker/*` or `/app/*`. Cleaner URLs, better SEO independence, and each route maps 1:1 to a sidebar item.

## Image Detail Drawer

When a user clicks an image card inside the app shell (`/search` or `/create`), a drawer opens instead of navigating to the SEO detail page. This keeps users in the app shell while still providing quick access to image details and downloads.

### Behavior by Viewport

**Desktop (md+)** — Right drawer, 420px wide:
- Slides in from the right over a dimmed backdrop (`bg-black/30`)
- Fixed to the right edge, full viewport height
- Close via: backdrop click, Escape key, or X button
- Framer Motion animation: `x: '100%'` → `x: 0`

**Mobile (<md)** — Bottom sheet, ~85vh:
- Slides up from the bottom with rounded top corners (`rounded-t-2xl`)
- Drag handle (gray pill) at the top — swipe down past 100px threshold to dismiss
- Framer Motion `drag="y"` with elastic constraints
- z-40 (above bottom nav at z-30)

### Drawer Content

- Large image preview (aspect-square, `object-contain`)
- Title
- Category badge (links to SEO category page)
- Style tag
- **Download Free PNG** button — triggers `downloadClip()`, drawer stays open
- **Generate Similar** link — navigates to `/create`, drawer closes
- **View full page →** link — navigates to `/${category}/${slug}` (SEO detail page)

### State Management

Separate zustand store (`src/stores/useImageDrawer.ts`) to avoid coupling with the main app store:

```typescript
interface DrawerImage {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  style: string;
}

// Actions: open(image), close()
// State: image (null when closed)
```

### Integration

- `ImageDetailDrawer` renders in `app/(app)/layout.tsx` as a sibling to `AppSidebar` and `AppBottomNav`
- `/search` page: image card `<Link>` replaced with `onClick` → `useImageDrawer.open(item)`
- `/create` page: `CommunityFeed` cards get same `onClick` handler
- No changes to SEO detail pages — direct URL access (`/free/abc123`) still renders the full `ImageDetailPage`

### Interaction Table

| Action | Result |
|--------|--------|
| Click image card on `/search` or `/create` | Drawer opens |
| Click backdrop | Drawer closes |
| Press Escape | Drawer closes |
| Swipe down on mobile handle | Drawer closes |
| Click "Download Free PNG" | Downloads image, drawer stays open |
| Click "Generate Similar" | Navigates to `/create`, drawer closes |
| Click "View full page →" | Navigates to SEO detail page, drawer closes |

## File Inventory

New files:
- `app/(app)/layout.tsx`
- `app/(app)/create/page.tsx`
- `app/(app)/search/page.tsx`
- `app/(app)/my-art/page.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/AppBottomNav.tsx`
- `src/components/ImageDetailDrawer.tsx`
- `src/stores/useImageDrawer.ts`

Modified files:
- `app/generator/page.tsx` — redirect to `/create`
- `src/components/Nav.tsx` — Create link → `/create`
- `src/components/CategoryNav.tsx` — Create link → `/create`
- `src/components/CategoryPage.tsx` — all generator links → `/create`
- `src/components/ImageDetailPage.tsx` — all generator links → `/create`
- `app/auth/callback/route.ts` — redirect → `/create`
- `app/api/credits/checkout/route.ts` — Stripe URLs → `/create`
