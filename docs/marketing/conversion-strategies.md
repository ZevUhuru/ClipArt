# Conversion Strategies

Documented CTA and copy decisions across clip.art marketing surfaces.

---

## Detail Page Header CTA

**Date:** 2026-03-26
**Location:** `src/components/CategoryNav.tsx`

**Change:** "Get Credits" → "Get Free Credits"

**Options considered:**
| Copy | Pros | Cons |
|------|------|------|
| Get Free Credits | "Free" removes cost friction instantly; concise; clear value prop | Slightly longer than original |
| Get My Free Credits | Personal ("my") + free = emotional pull | Too long for compact header on mobile; "my" implies existing credits |
| Get My Credits | Personal tone | No "free" signal; confusing for new visitors |

**Decision:** "Get Free Credits" -- the word "free" is the single strongest conversion lever for first-time visitors landing on SEO detail pages. Keeping it short ensures it fits well on mobile without truncation.

---

## Detail Page Header Redesign

**Date:** 2026-03-26
**Location:** `src/components/CategoryNav.tsx`

**Change:** White header → dark header (`#1c1c27`) matching sidebar/footer

**Rationale:** Visual consistency across the brand. Dark header with white logo creates a premium feel and clearly separates the navigation from the white content area below. The "Sign in" button stays white for maximum contrast as a secondary CTA.

---

## Detail Page Trust Strip

**Date:** 2026-03-26
**Location:** `src/components/ImageDetailPage.tsx`

**Change:** Plain "Free for personal and commercial use. No attribution required." text → three checkmark badges

**Badges:**
- Free for commercial use
- No attribution required
- High-resolution PNG

**Rationale:** Checkmarks with green icons create visual trust signals that scan faster than a sentence. Each badge addresses a common hesitation point: licensing, attribution, and quality.

---

## Download Button Shimmer

**Date:** 2026-03-26
**Location:** `src/components/ImageDetailPage.tsx`, `src/styles/globals.css`

**Change:** Static download button → shimmer highlight animation on hover

**Rationale:** Subtle motion draws the eye to the primary conversion action without being distracting. The shimmer only appears on hover, so it rewards engagement rather than creating visual noise.

---

## Free Credits Messaging

**Date:** 2026-03-25
**Location:** Homepage, auth modal, detail pages

**Current offer:** 10 free credits on signup

**Key placements:**
- Homepage hero: "10 free credits" badge (mobile)
- Auth modal signup: "10 free credits included"
- Detail page CTA banner: "10 free credits when you sign up"
- Header button: "Get Free Credits"
