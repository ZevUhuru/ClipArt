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

GPT Image 1 is **~3.5x cheaper** than Gemini 2.5 Flash per image. DALL-E 2/3 deprecated May 2026.

## Revenue per credit

| Package | Price | Credits | Revenue/credit |
|---------|-------|---------|----------------|
| Starter (15 credits) | $4.99 | 15 | $0.33 |
| Mini (5 credits) | $1.99 | 5 | $0.40 |
| Value (30 credits) | $7.99 | 30 | $0.27 |
| Power (100 credits) | $19.99 | 100 | $0.20 |

Even at the worst margin (Power pack), revenue per credit ($0.20) comfortably exceeds both GPT Image 1 ($0.011) and Gemini ($0.039). Margins are healthy for either model.

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
