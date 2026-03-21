# Pricing Strategy

## Competitive Landscape

### Etsy (pre-made clip art)

| Format | Price | Per Image | Notes |
|--------|-------|-----------|-------|
| Small themed set (12 images) | ~$4.64 | ~39¢ | Closest comparable to clip.art |
| Lifetime bundle (3,500+) | ~$24 | ~0.7¢ | Bulk hoarders, not our market |
| Mega bundle (40,000+) | ~$150 | <0.4¢ | Designer asset libraries |

### clipart.com (legacy subscription)

| Plan | Price | Notes |
|------|-------|-------|
| Weekly | $14.95 | Unlimited downloads from library |
| Monthly | $29.95 | Still generating revenue in 2026 |

### AI generators (imagine.art, etc.)

| Model | Price | Per Image |
|-------|-------|-----------|
| Free tier | $0 | Limited, watermarked |
| Credits | $5-20/mo | ~5-15¢ per image |
| Subscription | $10-30/mo | Varies by volume |

## Why clip.art Can Charge a Premium

Etsy and stock sites sell **pre-made** clip art. You search, browse, and hope something fits. clip.art generates **exactly what you describe** in seconds. This is a fundamentally different value proposition:

1. **Precision** -- "a blasian toddler decorating a christmas tree" returns exactly that, not a generic stock image
2. **Speed** -- Generated in ~10 seconds vs browsing Etsy for 20+ minutes
3. **Uniqueness** -- Every image is one-of-a-kind, no other site has it
4. **Convenience** -- No downloading ZIP files, no sorting through bundles
5. **Commercial use** -- Included by default, no license hunting

The real competition is Etsy's small themed sets at ~39¢/image. clip.art is cheaper than that at every tier.

## Cost Structure

### Per generation cost

| Component | Cost |
|-----------|------|
| Gemini 2.5 Flash Image API | ~$0.04-0.08 |
| R2 storage (WebP, ~50KB) | negligible |
| R2 bandwidth (CDN) | negligible |
| Vercel compute | negligible |
| **Total per generation** | **~$0.05-0.08** |

### Stripe fees per transaction

| Transaction | Stripe Fee | Net |
|-------------|-----------|-----|
| $1.99 | $0.36 (18%) | $1.63 |
| $2.99 | $0.39 (13%) | $2.60 |
| $4.99 | $0.44 (9%) | $4.55 |
| $5.99 | $0.47 (8%) | $5.52 |
| $8.99 | $0.56 (6%) | $8.43 |

Stripe fee = 2.9% + $0.30 per transaction. Smaller purchases lose a higher % to fees.

## Current Pricing Options

### Option A: Slot Modal (recommended for launch)

| Tier | Price | Credits | Per Credit | Margin After Fees + COGS |
|------|-------|---------|------------|--------------------------|
| Mini | $2.99 | 10 | 29.9¢ | ~$2.10 (70%) |
| Value | $5.99 | 40 | 15.0¢ | ~$3.52 (59%) |
| Power | $8.99 | 75 | 12.0¢ | ~$4.68 (52%) |

**Why this works:**
- All under $10 = impulse buy territory
- The Value tier is the obvious choice (2x price of Mini gets 4x credits)
- Power tier exists mainly as a decoy to make Value look smarter (center-stage effect)
- $2.99 entry is low enough for "just try it" but high enough that Stripe fees don't destroy margin

### Option B: Lower Entry (if conversion is poor)

| Tier | Price | Credits | Per Credit | Margin After Fees + COGS |
|------|-------|---------|------------|--------------------------|
| Mini | $1.99 | 8 | 24.9¢ | ~$1.23 (62%) |
| Value | $4.99 | 35 | 14.3¢ | ~$2.80 (56%) |
| Power | $8.99 | 75 | 12.0¢ | ~$4.68 (52%) |

**When to switch:** If <5% of free-tier users convert within the first 2 weeks. The $1.99 entry removes almost all friction but Stripe takes 18%.

### Option C: Original 2-Tier (current production)

| Tier | Price | Credits | Per Credit | Margin After Fees + COGS |
|------|-------|---------|------------|--------------------------|
| Starter | $5.00 | 30 | 16.7¢ | ~$3.06 (61%) |
| Pro | $12.00 | 100 | 12.0¢ | ~$6.44 (54%) |

**When to use:** Simpler UI, higher average order value. Good if most buyers are repeat users who already know they want credits.

## Decision Framework

```
User signs up → gets 5 free credits → generates images
                                           │
                              Runs out of credits
                                           │
                      ┌────────────────────┼────────────────────┐
                      │                    │                    │
               Price sensitive      Average user          Power user
               "Is this worth it?"  "I need more"         "I use this daily"
                      │                    │                    │
                 Mini ($2.99)        Value ($5.99)        Power ($8.99)
                 Gateway buy         Core revenue         Whale capture
                      │                    │                    │
                 Try 10 images      40 images lasts      75 images for
                 Decide if they     1-2 weeks for        heavy projects
                 want more          casual use
```

## Key Metrics to Track

1. **Free-to-paid conversion rate** -- % of signups who buy credits within 7 days (target: >5%)
2. **Average order value** -- Which tier most people pick (want: Value tier)
3. **Repeat purchase rate** -- % who buy again within 30 days (target: >25%)
4. **Revenue per user** -- Total spend per user over first 90 days

## Recommendation

**Launch with Option A (Slot Modal)**. The 3-tier under-$10 structure is the strongest for conversion:
- Low entry barrier ($2.99 vs $5.00 in the original)
- Clear value winner in the middle
- All impulse-buy range

If after 2 weeks the Mini tier is getting most purchases but few repeat buys, drop to Option B ($1.99 entry) to cast a wider net. If Value/Power dominate and people aren't price-sensitive, you could even raise the Power tier to $11.99 for better margins.

The original 2-tier (Option C) can stay as a fallback via the `NEXT_PUBLIC_CREDITS_MODAL_VARIANT` env var.
