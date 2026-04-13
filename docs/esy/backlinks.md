# ESY Backlinks on clip.art

This document tracks all dofollow links from clip.art pages pointing to **https://esy.com**, their placement rationale, and current status.

---

## Strategy

*Added 2026-04-13*

clip.art is a division of ESY LLC. The ESY attribution links serve two purposes:

**1. SEO link equity**
clip.art has significant organic search volume across hundreds of thousands of image detail pages. Each page carries a dofollow link to esy.com, passing authority at scale. The links are contextually relevant (clip.art is genuinely powered by ESY's automation infrastructure), which strengthens their SEO value over generic footer links.

**2. Referral traffic measurement**
UTM parameters differentiate traffic by content type (`clipart_detail`, `coloring_detail`, `illustration_detail`, `animation_detail`) so we can identify which content categories drive the most ESY interest. This informs where to invest future SEO content effort on clip.art — if coloring page visitors convert better on ESY, for example, we'd prioritize growing that catalog.

**Placement philosophy**
Links are placed at the lowest visual hierarchy tier (`text-[10px]`, 70% opacity) in the existing trust/metadata zone, immediately below the trust strip. This ensures they are crawlable and visible without competing with primary user CTAs (download, generate similar). The goal is zero UX impact while maintaining full link equity.

---

## Active Links

### 1. Image Detail Pages — "Automated with ESY"

| Property | Value |
|----------|-------|
| **Text** | `Automated with ESY` |
| **Href** | `https://esy.com?utm_source=clipart&utm_medium=attribution_link&utm_campaign={variant}_detail` |
| **UTM breakdown** | `utm_campaign` is dynamically `clipart_detail`, `coloring_detail`, or `illustration_detail` based on page type |
| **rel** | `noopener` (dofollow — no `nofollow` or `noreferrer`) |
| **Target** | `_blank` |
| **Component** | `src/components/ImageDetailPage.tsx` |
| **Placement** | Below the trust strip (Free for commercial use / Attribution appreciated / High-resolution PNG) in the right column of the image detail hero |
| **Applies to** | Clip art detail pages, coloring page detail pages, illustration detail pages |
| **Visual weight** | `text-[10px] text-gray-400/70` — smallest visible text tier; centered |
| **Hover state** | `hover:text-gray-500` |
| **Status** | ✅ Live — shipped 2026-04-13, commit `0ae6ef0` |

**Design rationale:** The trust strip is already a low-hierarchy metadata zone. The ESY line sits one visual level below it as a natural footnote. At 10px / 70% gray opacity it is visible but does not compete with primary CTAs (download, generate similar).

---

### 2. Animation Detail Pages — "Automated with ESY"

| Property | Value |
|----------|-------|
| **Text** | `Automated with ESY` |
| **Href** | `https://esy.com?utm_source=clipart&utm_medium=attribution_link&utm_campaign=animation_detail` |
| **rel** | `noopener` (dofollow) |
| **Target** | `_blank` |
| **Component** | `app/animations/[slug]/page.tsx` |
| **Placement** | Below the trust strip (Free for commercial use / No attribution required / MP4 video download) in the right column of the animation detail hero |
| **Applies to** | All public animation detail pages |
| **Visual weight** | `text-[10px] text-gray-400/70` — matches image detail pages |
| **Status** | ✅ Live — shipped 2026-04-13, commit `9eec40a` |

---

### 3. Site Footer — "A division of ESY LLC"

| Property | Value |
|----------|-------|
| **Text** | `A division of ESY LLC` |
| **Href** | `https://esy.com` |
| **rel** | `noopener noreferrer` |
| **Target** | `_blank` |
| **Component** | `src/components/MarketingFooter.tsx` |
| **Placement** | Bottom bar of the marketing footer, below copyright line |
| **Applies to** | All public pages using `MarketingFooter` (clip art, coloring, illustrations, animations, learn) |
| **Visual weight** | `text-[11px] text-gray-600` |
| **Status** | ✅ Live (pre-existing) |

> **Note:** This link uses `noreferrer` which suppresses the HTTP referrer header. It does not carry `nofollow` and is dofollow from a search engine perspective. If full link equity passing is desired, `noreferrer` can be dropped to match the pattern used in the detail page link above.

---

## Adding New ESY Links

When placing additional ESY links, follow these conventions:

1. **Always dofollow** — never add `rel="nofollow"` to esy.com links
2. **Keep `noopener`** on all `target="_blank"` links for security
3. **Avoid `noreferrer`** if referrer attribution to esy.com is desired
4. **Match visual weight to context** — use `text-[10px]` or `text-xs` in metadata zones; do not use prominent text that competes with user-facing CTAs
5. **Document here** after adding any new link
