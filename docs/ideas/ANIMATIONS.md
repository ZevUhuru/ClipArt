# Animations Feature

**Date:** 2026-04-02
**Status:** SHIPPED (April 2026)

This feature has been fully implemented. See [docs/features/ANIMATION.md](../features/ANIMATION.md) for complete documentation.

## What changed from the original idea

The original plan was admin-gated generation first, with a public gallery at `/animations`. The shipped version instead:

- Opens animation to all authenticated users immediately (credit-gated, not admin-gated)
- Uses Fal.ai as the integration layer for Kling AI (not direct Kling API)
- Supports three model tiers: Kling 2.5 Turbo, 3.0 Standard, 3.0 Pro
- Integrates into the existing app shell (/animate page, sidebar, drawer, detail pages)
- Stores videos in R2 with per-animation credit pricing (5–12 credits)
- Mixes animated cards into existing image grids rather than a separate gallery
