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

## Current Pricing (Active)

### Slot Modal (primary)

| Tier | Price | Credits | Per Credit | Margin After Fees + COGS |
|------|-------|---------|------------|--------------------------|
| Quick Hit | $1.99 | 30 | 6.6¢ | ~$1.03 (52%) |
| Sweet Spot | $4.99 | 100 | 5.0¢ | ~$0.56 (11%) |
| Binge | $9.99 | 200 | 5.0¢ | ~-$0.57 (break-even) |

**Philosophy:** Maximize volume and addiction. The entry price is under $2 (impulse buy), credits feel abundant, and per-image cost is low enough that failed generations don't sting. We trade margin for retention and word-of-mouth.

### Original 2-Tier (fallback via env var)

| Tier | Price | Credits | Per Credit | Margin After Fees + COGS |
|------|-------|---------|------------|--------------------------|
| Starter | $4.99 | 100 | 5.0¢ | ~$0.56 (11%) |
| Pro | $9.99 | 200 | 5.0¢ | ~-$0.57 (break-even) |

**When to use:** Simpler UI, same pricing philosophy. Toggle via `NEXT_PUBLIC_CREDITS_MODAL_VARIANT`.

## Decision Framework

```
User signs up → gets 15 free credits → generates images → gets hooked
                                           │
                              Runs out of credits
                                           │
                      ┌────────────────────┼────────────────────┐
                      │                    │                    │
               Price sensitive      Average user          Power user
               "Just one more pull" "I need more"         "I use this daily"
                      │                    │                    │
               Quick Hit ($1.99)   Sweet Spot ($4.99)    Binge ($9.99)
               Impulse buy          Core revenue          Whale capture
                      │                    │                    │
                 30 images,         100 images lasts      200 images for
                 instant gratif.    weeks of casual use   heavy projects
```

## Key Metrics to Track

1. **Free-to-paid conversion rate** -- % of signups who buy credits within 7 days (target: >5%)
2. **Average order value** -- Which tier most people pick (want: Value tier)
3. **Repeat purchase rate** -- % who buy again within 30 days (target: >25%)
4. **Revenue per user** -- Total spend per user over first 90 days

## Modal UX Decisions

### Per-credit cost hidden from modals (2026-03-25)

We intentionally **do not** show the per-credit cent breakdown (e.g. "5.0¢ each") in the Buy Credits modal. Reasons:

1. **Commoditization risk** — showing "5¢ per image" anchors users to cost-of-production instead of value delivered. The value prop is precision + speed + uniqueness, not cheapness.
2. **Breaks tier differentiation** — Sweet Spot and Binge are both 5.0¢/credit, so the math undermines the "Best Value" badge. Quick Hit at 6.6¢ looks like a bad deal instead of an impulse buy.
3. **Invites free-tool comparison** — at the purchase moment, we don't want users mentally comparing to free AI generators. Our real anchor should be Etsy at ~39¢/image, not $0.
4. **Impulse buyers don't need it** — users who care about unit economics will do the math themselves. The rest shouldn't be given a reason to pause.

Instead, the modal reinforces: "No subscription" and "Credits never expire" — friction removers, not price justifications.

### Future: dedicated /pricing page

We may add a public `/pricing` or `/about#pricing` page that goes deeper on value comparison (vs Etsy, vs stock sites, vs other AI generators) for users who actively seek that info. This is the right place for per-credit breakdowns and competitive tables — not the checkout modal. Low priority for now.

## Recommendation

**Optimize for volume and habit formation, not margin per transaction.** The goal is to make generating feel like pulling a slot machine — cheap, fast, addictive. Users who generate frequently become advocates and repeat buyers.

- $1.99 entry removes virtually all purchase friction
- 15 free credits on signup gets users deep into the loop before the paywall hits
- High credit counts make users feel rich, not rationed
- If margins are too thin at scale, raise the generation quality/speed rather than the price
