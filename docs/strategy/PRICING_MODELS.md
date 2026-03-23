# Pricing Strategy: Multi-Model Costs

**Date:** 2026-03-22
**Status:** Active

## Current: 1 Credit = 1 Generation (Any Model)

All styles cost 1 credit regardless of which AI model generates the image. This keeps the UX simple — users pick a style, not a model.

## Cost Reality

| Model | Cost/image | At 1K images/month | At 10K images/month |
|-------|-----------|--------------------|--------------------|
| Gemini 2.5 Flash | ~$0.002 | $2 | $20 |
| DALL-E 3 Standard | ~$0.04 | $40 | $400 |
| DALL-E 3 HD | ~$0.08 | $80 | $800 |

DALL-E 3 is **20x more expensive** than Gemini per image.

## Revenue per credit

| Package | Price | Credits | Revenue/credit |
|---------|-------|---------|----------------|
| Starter (15 credits) | $4.99 | 15 | $0.33 |
| Mini (5 credits) | $1.99 | 5 | $0.40 |
| Value (30 credits) | $7.99 | 30 | $0.27 |
| Power (100 credits) | $19.99 | 100 | $0.20 |

Even at the worst margin (Power pack), revenue per credit ($0.20) far exceeds DALL-E 3 cost ($0.04). Absorbing the model cost difference is viable.

## When to reconsider

Switch to variable credit costs if:
- DALL-E usage exceeds 50% of total generations (unlikely — most styles default to Gemini)
- A premium model costs >$0.10/image
- Monthly API spend exceeds $500 and most of it is DALL-E

## Future: Pro subscription model

If a Pro tier is introduced ($9.99/month), model selection could be a premium feature:
- Free/credit users: auto-routed to best model per style (admin-configured)
- Pro users: can override model choice per generation

This makes the cost-per-image question moot for Pro users since they're paying a flat monthly fee.

## Decision

**Keep 1 credit for all models.** The margin is healthy, the UX stays simple, and the admin can limit DALL-E usage by only assigning it to styles where it meaningfully outperforms Gemini.
