# Automated Content Pipeline

## Overview

An agent-driven pipeline that generates keyword-targeted clip art at scale, quality-gates each image, and publishes to the site with proper SEO metadata. Goal: build a library of 100K-1M unique clip art images, each targeting a real search query.

## Pipeline Architecture

```
┌─────────────────┐
│  Agent 1:        │
│  Keyword Scout   │──→ ranked keyword list (daily)
│  (Ahrefs API)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 2:        │
│  Image Generator │──→ 2-3 variants per keyword
│  (DallE/NB API)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 3:        │
│  Quality Gate    │──→ best variant, score ≥ 7/10
│  (Gemini Vision) │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 4:        │
│  Classify +      │──→ title, desc, slug, category, tags
│  Publish         │──→ WebP to R2, row in generations
│  (Gemini Text)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Agent 5:        │
│  Index Manager   │──→ sitemap update, GSC monitoring
│  (Search Console)│
└────────┬────────┘
         ▼
┌─────────────────┐
│  Orchestrator    │──→ Slack/email daily summary
│  (Node.js cron)  │
└─────────────────┘
```

## Agent Specifications

### Agent 1: Keyword Scout

**Runs:** Daily, once
**Input:** Ahrefs API credentials, existing slug list from DB
**Output:** Ranked list of ~300 target keywords

Logic:
- Query Ahrefs Keywords Explorer for "* clip art" patterns
- Filter: volume > 50, keyword difficulty < 30
- Cross-reference existing `generations.slug` to skip covered keywords
- Rank by volume/difficulty ratio (higher volume + lower difficulty = higher priority)
- Also pull "Questions" and "Related terms" for long-tail opportunities

### Agent 2: Image Generator

**Runs:** Per keyword from Agent 1
**Input:** Target keyword
**Output:** 2-3 image variants in staging bucket

Logic:
- Convert keyword to generation prompt via Claude/GPT
  - "thanksgiving turkey clip art" → "a cute cartoon turkey with a pilgrim hat, Thanksgiving theme"
- Generate 2-3 variants across styles (flat, cartoon, sticker) for variety
- Upload raw outputs to R2 staging bucket (`staging/${keyword-slug}/`)
- Store metadata: keyword, prompt used, style, timestamp

### Agent 3: Quality Gate

**Runs:** Per image from Agent 2
**Input:** Image URL from staging
**Output:** Score (1-10), pass/fail, best variant selection

Logic:
- Send image to Gemini Vision with scoring rubric:
  - Subject accuracy (does it match the keyword?) — 0-3 points
  - Visual quality (sharp, clean lines, no artifacts) — 0-3 points
  - Background (transparent or clean, no noise) — 0-2 points
  - Style consistency (looks like professional clip art) — 0-2 points
- Reject anything scoring < 7
- If multiple variants pass, pick the highest scorer
- Delete rejected images from staging
- Expected acceptance rate: 70-80%

### Agent 4: Classifier + Publisher

**Runs:** Per approved image from Agent 3
**Input:** Approved image + target keyword
**Output:** Published generation with full SEO metadata

Logic:
- Run existing `classifyPrompt()` with the original keyword as context
- Ensure title includes the target keyword naturally
- Generate unique description (not templated — use Gemini to write 1-2 sentences specific to the image)
- Convert to WebP, upload to R2 production bucket
- Insert into `generations` table with `is_public: true`
- Revalidate the relevant category page

### Agent 5: Index Manager

**Runs:** Daily, after publishing
**Input:** New page URLs from Agent 4
**Output:** Updated sitemap, GSC status report

Logic:
- Regenerate sitemap.xml with new pages (paginated if > 50K URLs)
- Ping Google with sitemap update
- Check Google Search Console API for:
  - Crawl errors on new pages
  - Index coverage (how many pages indexed vs submitted)
  - Crawl rate (is Google keeping up?)
- If crawl rate is declining, throttle Agent 1's output for next day
- Generate daily report

### Orchestrator

**Runs:** Daily cron (e.g., 2 AM)
**Input:** Configuration (target count, quality threshold, API keys)
**Output:** Slack/email summary

Daily summary includes:
- Keywords targeted: N
- Images generated: N
- Quality gate pass rate: N%
- Images published: N
- Total library size: N
- Crawl coverage: N% indexed
- Cost for the day: $N
- Any errors or warnings

## Scale Targets

### Ramp-up Schedule

| Phase | Timeline | Images/day | Monthly | Yearly run-rate |
|-------|----------|-----------|---------|-----------------|
| Seed | Month 1-2 | 50 | 1,500 | 18K |
| Growth | Month 3-6 | 150 | 4,500 | 54K |
| Scale | Month 7-12 | 250 | 7,500 | 90K |
| Full | Year 2+ | 500-2,750 | 15K-82K | 180K-1M |

Gradual ramp-up is critical. Google needs time to:
- Build trust with the domain
- Allocate sufficient crawl budget
- Recognize the site as a legitimate image asset library

### Can We Do 1M Images/Year?

**Yes.** For reference:
- Shutterstock: 450M+ images
- Freepik: 90M+ resources
- Flaticon: 16M+ icons
- Vecteezy: 30M+ resources

1M pages is well within what Google indexes for legitimate asset sites. The key requirements:
- Every page has a unique, high-quality image
- Every page targets a real keyword with search demand
- Quality gate keeps acceptance rate at 70-80%
- Text content is genuinely unique per page (not templated)
- Proper technical SEO (paginated sitemaps, canonical tags, fast load times)
- Domain authority grows alongside content volume

1M/year = ~2,750/day. At that rate, expect ~3,500-4,000 generations/day (accounting for quality gate rejections).

### Google Penalty Risk by Scale

| Scale | Risk | Mitigation |
|-------|------|------------|
| 10K pages | Negligible | Basic quality gate |
| 50K pages | Low | Unique descriptions, proper categorization |
| 100K pages | Low-Medium | Keyword targeting, crawl budget monitoring |
| 500K pages | Medium | GSC monitoring, selective noindex for low-performers |
| 1M pages | Medium | Full pipeline with quality gate, crawl throttling, content pruning |
| 5M+ pages | Higher | Need dedicated SEO team, content audits, pruning low-traffic pages |

The risk is never about the number of pages — it's about the **percentage of low-quality pages**. 1M great pages = no penalty. 100K pages where 40% are junk = penalty.

## Cost Analysis

### Image Generation Costs (1M images/year)

Assuming ~30% rejection rate → need to generate ~1.3M images to publish 1M.

| Provider | Per image | 1.3M images | Annual cost |
|----------|----------|-------------|-------------|
| **GPT Image 1 Mini** (cheapest) | $0.005 | $6,500 | **$6,500** |
| **GPT Image 1.5** (best value) | $0.009 | $11,700 | **$11,700** |
| **NanoBanana 2 1K** (Batch API, 50% off) | $0.0225 | $29,250 | **$29,250** |
| **NanoBanana 2 1K** (third-party) | $0.04 | $52,000 | **$52,000** |
| **DALL-E 3** (standard) | $0.04 | $52,000 | **$52,000** |
| **NanoBanana Pro 1K** | $0.134 | $174,200 | **$174,200** |

### Supporting Costs

| Service | Per image | 1.3M images | Annual |
|---------|----------|-------------|--------|
| Gemini Vision (quality gate) | ~$0.003 | $3,900 | $3,900 |
| Gemini Flash (classification) | ~$0.001 | $1,300 | $1,300 |
| Claude/GPT (prompt engineering) | ~$0.001 | $1,300 | $1,300 |
| **Subtotal (supporting)** | | | **$6,500** |

### Infrastructure Costs

| Service | Monthly | Annual |
|---------|---------|--------|
| Ahrefs API (Standard) | $249 | $2,988 |
| R2 storage (~100KB/img, 1M imgs = 100GB) | ~$1.50 | ~$18 |
| R2 egress (Class B ops) | ~$5 | ~$60 |
| Vercel Pro (hosting) | $20 | $240 |
| **Subtotal (infra)** | | **~$3,300** |

### Total Annual Cost (1M images)

| Scenario | Generation | Supporting | Infra | **Total** |
|----------|-----------|------------|-------|-----------|
| **Budget** (GPT Image 1 Mini) | $6,500 | $6,500 | $3,300 | **$16,300** |
| **Mid-range** (GPT Image 1.5) | $11,700 | $6,500 | $3,300 | **$21,500** |
| **Premium** (NanoBanana 2 Batch) | $29,250 | $6,500 | $3,300 | **$39,050** |
| **High-end** (DALL-E 3) | $52,000 | $6,500 | $3,300 | **$61,800** |

### Cost per Published Image

| Scenario | All-in cost per image |
|----------|----------------------|
| Budget | $0.016 |
| Mid-range | $0.022 |
| Premium | $0.039 |
| High-end | $0.062 |

### Break-even Analysis

At $0.016-$0.062 per image, a single credit purchase ($4.99 for 15 credits) covers the cost of 80-312 pipeline images. The pipeline pays for itself if even a tiny fraction of visitors convert.

More importantly: 1M keyword-targeted pages generating organic traffic at even $0.01 RPM (ad revenue) or 0.1% conversion to credit purchases would significantly exceed the pipeline cost.

## Revised Strategy: Seed + UGC Flywheel

After analysis, a 1M-image brute-force approach is unnecessary. The optimal path:

### Phase 1: Seed Library (25K-50K images)

The pipeline generates a critical mass of keyword-targeted images covering the most-searched clip art terms. This is enough to:
- Rank for thousands of long-tail queries in Google Images
- Populate every category with quality content
- Establish domain authority

### Phase 2: UGC Flywheel Takes Over

Once organic traffic arrives, user-generated content compounds the library:

```
Pipeline seeds 50K images → Google indexes them → Organic traffic →
Users sign up → Users generate clip art → Public by default →
More pages indexed → More traffic → More users → ...
```

At 1,000 daily active users averaging 3 generations each, users produce 3,000 images/day — more than the pipeline ever could, and at zero generation cost to us (users spend their own credits).

### Why Not 1M From the Pipeline?

- **Cost**: Even the budget scenario is $16K+ for 1M images
- **Diminishing returns**: Long-tail keyword demand is finite — beyond 50K you're targeting increasingly thin queries
- **UGC is free**: Every user generation is a page we didn't pay to create
- **UGC is diverse**: Real users generate things keyword research can't predict

### The Public/Private Toggle Factor

The [public/private toggle](../features/PUBLIC_PRIVATE_TOGGLE.md) defaults to ON, meaning most user-generated content feeds back into the public library. This is the mechanism that turns paid credits into organic growth:

- Pipeline images: always `is_public: true`
- User images: `is_public: true` by default (user can opt out)
- Expected public rate from users: 80-90% (most won't toggle it off)

## Implementation Priority

1. **Start with a manual batch script** — run 50 images, verify quality, tune prompts
2. **Automate Agents 2-4** — image generation through publishing
3. **Add Agent 1** (Ahrefs integration) once manual keyword selection is validated
4. **Add Agent 5** (index management) once page count exceeds 10K
5. **Add orchestrator + notifications** when running daily at scale
6. **Taper pipeline volume** once UGC generates 1K+ public images/day

## Quality Safeguards

- **Never publish without quality gate.** 100% of images must pass scoring.
- **Human review of first 500 images** to calibrate the quality gate threshold.
- **Monthly content audits**: pull GSC data, identify pages with 0 impressions after 90 days, consider noindex or removal.
- **A/B test image providers**: run GPT Image 1 Mini vs NanoBanana 2 for 1,000 images each, compare quality gate pass rates and Google Images click-through rates.
- **Keep editorial oversight**: the pipeline should feel like a tool that helps you publish, not a fully autonomous system. Review daily summaries, spot-check images weekly.
