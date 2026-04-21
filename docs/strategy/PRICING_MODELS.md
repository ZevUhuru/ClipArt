# Pricing Strategy: Multi-Model Costs

**Date:** 2026-03-22
**Updated:** 2026-03-23 (corrected pricing from official Google/OpenAI docs)
**Status:** Active

## Current: 1 Credit = 1 Generation (Any Model)

All styles cost 1 credit regardless of which AI model generates the image. This keeps the UX simple — users pick a style, not a model.

## Cost Reality (verified 2026-03-23)

| Model | Cost/image | At 1K imgs/mo | At 10K imgs/mo | At 1M imgs/yr |
|-------|-----------|---------------|----------------|---------------|
| GPT Image 1 (OpenAI) | ~$0.011 | $11 | $110 | $11,000 |
| Gemini 2.5 Flash (Google) | ~$0.039 | $39 | $390 | $39,000 |
| Gemini 2.5 Flash batch | ~$0.0195 | $19.50 | $195 | $19,500 |

GPT Image 1 at low quality (~$0.011 square) is **~3.5x cheaper** than Gemini 2.5 Flash per image. GPT Image 2 at medium (ChatGPT Images 2.0, released 2026-04-21) costs $0.053 for square 1024² and $0.041 for non-square — more expensive than GPT Image 1 on square but **cheaper on the 3:4 / 4:3 ratios we use for coloring pages and illustrations**.

## Revenue per credit

| Package | Price | Credits | Revenue/credit |
|---------|-------|---------|----------------|
| Quick Hit | $1.99 | 30 | $0.07 |
| Sweet Spot | $4.99 | 100 | $0.05 |
| Binge | $9.99 | 200 | $0.05 |

Revenue per credit is lower than before — this is intentional. We're optimizing for volume and habit formation over per-transaction margin. Even at the lowest tier ($0.05/credit), revenue still exceeds GPT Image 1 cost ($0.011) and covers Gemini ($0.039) with slim margin.

## When to reconsider

Switch to variable credit costs if:
- A premium model costs >$0.10/image
- Monthly API spend exceeds $1,000
- Pipeline seeding uses Gemini heavily without batch mode (consider switching to GPT Image 1 or Gemini batch)

## Future: Pro subscription model

If a Pro tier is introduced ($9.99/month), model selection could be a premium feature:
- Free/credit users: auto-routed to best model per style (admin-configured)
- Pro users: can override model choice per generation

This makes the cost-per-image question moot for Pro users since they're paying a flat monthly fee.

## Decision

**Keep 1 credit for all models.** The margin is healthy, the UX stays simple, and the admin routes styles to the best model per quality. For pipeline seeding at scale, GPT Image 1 ($11K/1M) is far more cost-effective than Gemini standard ($39K/1M). Consider Gemini batch ($19.5K/1M) if async generation is acceptable.
