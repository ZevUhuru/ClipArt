# Strategy Session: clip.art Verticals & esy.com

**Date:** 2026-03-21

---

## clip.art: Business Model & Monetization

### Free Clip Art — No Attribution Required

Decision: Offer free clip art without requiring attribution.

Rationale:
- Attribution requirements kill adoption — users pick worse images from no-attribution sources over better ones that require links
- Enforcement is impossible; most people won't comply anyway
- Competitive disadvantage against established no-attribution players
- The Unsplash model proved no-attribution wins on growth
- Free clip art is the funnel, not the product — AI generation credits are the business model

Middle ground: "Attribution appreciated but not required" with a one-click copy button. Some users will voluntarily link back.

### Unsplash Cautionary Tale

Unsplash raised ~$30M, never figured out sustainable monetization independently, and was acquired by Getty Images (reportedly not a huge exit relative to capital raised). Their model: sponsored branded collections + API licensing.

Key lesson: "Free without a paid layer doesn't work." clip.art already has the paid layer (credit-based AI generation). The free gallery is marketing spend, not the business model.

### Path to $10K MRR

Need ~$14K MRR gross to clear $10K post-tax. At $10-15 avg transaction with 2-3% conversion rate, need 30K-70K monthly active users (60K-100K monthly visits).

**Phased plan:**
- Phase 1 (Months 1-4): $0-500/mo — Generator + SEO foundations, 5-10K visits
- Phase 2 (Months 5-9): $500-2,500/mo — Content starts ranking, packs launched, 15-30K visits
- Phase 3 (Months 10-16): $2,500-8,000/mo — Content flywheel kicks in, subscription tier introduced, 40-70K visits
- Phase 4 (Months 14-20): $8,000-14,000/mo — Subscription base growing, API tier, 70-100K+ visits

**Revenue mix target at $14K/mo:**
| Source | % | Monthly |
|--------|---|---------|
| Subscriptions (Pro plan) | 50% | $7,000 |
| One-off credit packs | 25% | $3,500 |
| Packs/bundles | 15% | $2,100 |
| API access | 10% | $1,400 |

The subscription tier is the key unlock — one-off credit purchases are unpredictable.

---

## clip.art: Site Architecture

### Current → Future Structure

Move existing homepage (generator) to `/generator` (or `/create`). Build a proper marketing homepage at `/` that serves as a hub for all sections.

Rationale: The homepage needs to become a hub, not just the generator. The generator stays immersive with no footer. Marketing pages get proper footers for internal linking and SEO.

**Site map:**

| Route | Purpose | Revenue Type |
|-------|---------|-------------|
| `/` | Marketing homepage & hub | Conversion |
| `/generator` | AI clip art generation (current homepage) | Credits / Subscription |
| `/dictionary/*` | Word-based clip art collections | Traffic → Conversion |
| `/packs` | Premium curated bundles | Direct sales |
| `/video` | Animated clip art library | Premium credits / Subscription |
| `/coloring-pages` | Free coloring pages | Traffic → Conversion |
| `/learn/*` | Tutorials & prompt guides | Traffic / SEO |
| `/faq` | Pricing, licensing, trust | Conversion support |
| `/about` | Brand story | Trust |

### Footer Strategy

- Homepage stays clean and immersive — no footer
- All subpages get a minimal footer with internal links for SEO
- Separation: homepage = marketing experience, generator = immersive tool, content pages = SEO structure

---

## clip.art: Verticals Deep Dive

### /dictionary/*

Not a traditional dictionary — a collection page per word. Each page accumulates every clip art variation featuring that word (e.g., `/dictionary/play` has a hippo holding "PLAY," a kid on a swing with "PLAY," blocks spelling "PLAY," etc.).

Strengths:
- Pages grow richer over time (no thin content problem)
- Strong educational use case — word visually reinforced in context with illustration
- Natural internal linking between related words, categories, grade levels
- Unique product category — no other clip art site organizes by word
- Maps to how teachers and parents actually search

### /packs

Curated, themed bundles (e.g., "Back to School," "Holiday Bundle"). Targets teachers, marketers, small business owners.

- Higher willingness to pay than individual downloads
- Requires visual consistency within each pack
- Good for seasonal spikes
- Potential to open as a creator marketplace (30% take rate)

### /video (Animated Clips)

Reusable animated clip art — looping GIFs, WebM, MP4. The animated equivalent of what clip art is for static images.

Market gap: No good source exists for simple, looping, clip-art-style animations. Current options (stock video, Lottie, Giphy) don't serve this niche.

Formats: GIF, WebM, MP4, transparent background. Drop into slides, worksheets, websites, social posts.

Higher perceived value than static art — can command premium pricing.

Production pipeline: Generate static clip art → animate with Kling AI 3.0 → curate into library.

### /coloring-pages

Massive traffic play, not a direct revenue play.

Keyword data (from Ahrefs):
- 786 keywords in the cluster, 30K+ combined search volume
- KD (keyword difficulty) of 0 across almost all terms
- Long-tail terms like "trippy coloring pages," "zen coloring pages," "bold and easy coloring pages"
- CPC is very low ($0.04-$1.30) — people expect free

Monetization: Funnel traffic to generator/packs/subscriptions. Pack coloring pages into premium PDFs. Print-on-demand coloring books.

### /learn

Blog/tutorial section positioned as "Learn" or "Guides" (not "Blog" — avoids staleness pressure).

Content: Prompting tips, style guides, use case tutorials, integration guides (Canva, PowerPoint, Notion).

Serves as top-of-funnel SEO capture for informational queries.

### Homepage Video

Include a short (10-20s) silent, autoplay, muted, looping screen recording of the generation flow below the hero fold. Optimized aggressively (WebM/MP4, lazy loaded, under 2-3MB).

---

## clip.art: Expansion Beyond Clip Art

### Near-term expansions (same generation pipeline):
- **Coloring pages** — prompt variation: "black and white outline, coloring book style"
- **Icons & UI assets** — adjacent search category
- **Stickers** — already a style option in generator
- **Patterns & backgrounds** — seamless tiles for web/fabric/print

### Medium-term (new capabilities):
- **Personalization** — Upload photo, generate clip art character that looks like them. Use across coloring pages, storybooks, flashcards. "Starring YOUR child." Highest premium potential.
- **Animation** — Animate any clip art (waving, bouncing, walking). Export as GIF/Lottie/MP4.
- **Story animation builder** — Sequence scenes on a timeline, add animations + voiceover, export as MP4.
- **Educational tools** — Worksheet builder, flashcard generator, story sequencing cards.

### Long-term (platform):
- **Templates marketplace** — Worksheet/presentation/social media templates using clip art
- **Creator marketplace** — Others sell packs on the platform (30% take)
- **API** — Developers integrate generation engine ($0.05-0.20/generation)
- **White-label for schools** — $5K-20K/year per district
- **Print-on-demand** — Mugs, shirts, sticker sheets via Printful/Printify

### Path to $100K MRR

| Revenue Line | MRR | Key Metric |
|-------------|-----|-----------|
| Pro subscriptions (creators) | $25,000 | 1,500 subs @ $17/mo |
| Education platform (teachers) | $25,000 | 1,200 subs @ $20/mo |
| Personalized products (parents) | $15,000 | 1,000 orders/mo @ $15 |
| Animation/video tier | $15,000 | 500 subs @ $30/mo |
| Packs & marketplace | $8,000 | 800 purchases/mo @ $10 |
| API & B2B | $7,000 | Usage-based |
| Physical products/POD | $5,000 | 600 orders/mo @ $8 margin |
| **Total** | **$100,000** | |

Timeline: 2-3 year build. Each tier builds on the previous one.

Core insight: Clip art is the atom, not the product. The atom gets assembled into increasingly valuable molecules — worksheets, storybooks, animations, physical products. Each layer up the value chain commands higher prices.

---

## YouTube: @ClipArtAnimation

### Strategy

All videos are Kling AI 3.0 animated clip art combined into educational and fun animations. This creates a unique content category nobody else occupies.

**Why YouTube over TikTok (primary channel):**
- Longevity — YouTube videos get searched/recommended for years vs. 48h on TikTok
- Intent — YouTube users are in "learn and do" mode, matching buyer demographic
- Demographics — Teachers, parents, small business owners are on YouTube
- Link-friendly — Descriptions, pinned comments, and cards drive traffic to clip.art
- Ad revenue — Educational/creative content runs $5-15 RPM
- SEO boost — YouTube videos rank in Google search results

TikTok is the amplifier — repurpose every YouTube video into 2-3 Shorts/TikToks for awareness and virality.

**Content types:**
- Satisfying process videos ("Watch this prompt become animation")
- Tutorials ("How to create animated flashcards for your classroom")
- Serialized challenges ("I animated my daughter's spelling words for a week")
- Before/after ("Turning kids' drawings into professional clip art")
- Tool showcases
- Full animated stories

**At 50K subs:**
- 5-15K views first 48 hours per video
- 10-50K lifetime views per video
- 2-5% CTR to site = 2,000-30,000 monthly visits from YouTube alone

Primary value is brand authority + content repurposing flywheel + community feedback, not just direct traffic.

**Content-product loop:** Videos are simultaneously content, marketing, and R&D. The animations created for YouTube become inventory for clip.art/video.

### Sequencing

Build the product first (generator, dictionary, packs, subscriptions), then start the channel once there's something worth showcasing.

---

## esy.com: Research-First Writing Platform

### Concept

esy.com = "Make hard writing tasks easy." Not a ChatGPT wrapper — a research-to-writing pipeline.

**Architecture:**
1. **Core research engine** — Takes any topic, pulls real sources, synthesizes verified information, builds a knowledge package
2. **Templates as presentation layer** — Same research shaped into whatever format the user needs

The research is the hard, valuable part. The template is just the mold.

### Template Routes (SEO pages)

```
esy.com/templates/essay
esy.com/templates/cover-letter
esy.com/templates/business-proposal
esy.com/templates/best-man-speech
esy.com/templates/product-review
esy.com/templates/grant-application
esy.com/templates/press-release
esy.com/templates/case-study
esy.com/templates/lesson-plan
esy.com/templates/book-report
esy.com/templates/linkedin-post
esy.com/templates/investor-update
esy.com/templates/complaint-letter
esy.com/templates/thesis-outline
esy.com/templates/job-description
```

Each template page is a long-tail SEO landing page. Adding templates costs almost nothing — just prompt engineering + a page.

### Research Package Output

Each generation delivers:
- Generated document in chosen template format
- All sources used with links
- Key facts/data points with citations
- Confidence scores on claims
- Related sources for further reading
- Bibliography in chosen format (APA, MLA, Chicago, Harvard)

This is the differentiator: verifiable, cited, transparent output vs. the black-box text generation everyone else offers.

### Domain Value

- 3-letter .com — inherently scarce, trades $5K-$50K+ as a domain alone
- Pronounceable as "easy" — universally positive connotation
- Versatile — doesn't lock into one vertical

### Business Model

| Tier | What You Get | Price |
|------|-------------|-------|
| Free | Basic research, 3 sources, 1 template | $0 |
| Single use | Deep research, 10+ sources, any template, full citation package | $3-5 |
| Pro monthly | Unlimited research, all templates, export, saved history | $15-25/mo |
| Team | Shared research library, collaboration, custom templates | $40-80/mo |

Pricing is by research depth, not template type. Templates are free — research is the value.

**Future:** Open template creation to community → marketplace (teacher creates "5-paragraph argumentative essay" template, freelancer creates "Upwork proposal" template).

### Risks

- Academic integrity backlash — position as "research assistant," not "write my homework"
- AI detection arms race (Turnitin, GPTZero)
- AI writing commoditization — moat must be citation accuracy, not writing quality

---

## Company Structure

One LLC operating both products:
- clip.art — visual content platform
- esy.com — research & writing platform

Shared: hosting stack, auth, Stripe, billing logic, operational knowledge (SEO, credit-based monetization, template architecture).

Zero audience overlap, zero cannibalization. Diversified revenue streams.

### Sequencing

| Period | Focus | Split |
|--------|-------|-------|
| Now → Month 8-10 | clip.art: dictionary, packs, subscriptions, learn, SEO flywheel | 90% clip.art |
| Month 8-12 | Build esy.com MVP (research engine + 5-10 templates) | 60/40 |
| Month 12+ | Both live, maintain and grow | 50/50 |

### Combined Revenue Potential

| | clip.art | esy.com | Combined |
|---|---------|--------|----------|
| Year 2 MRR | $15-25K | $5-10K | $20-35K |
| Year 3 MRR | $40-60K | $20-35K | $60-95K |
| Year 5 MRR | $80-120K | $40-70K | $120-190K |
| Exit (5-8x ARR) | $4.8-11.5M | $2.4-6.7M | $7.2-18.2M |

---

## Key Takeaways

1. **clip.art has rare domain-product alignment** — the domain IS the search term, the market is underserved, AI generates the output perfectly, and there are 10+ verticals that reinforce each other.
2. **Free content is the funnel, credits/subscriptions are the business.**
3. **The subscription tier is the single most important thing for MRR.**
4. **Personalization (custom characters from photos) may be the highest-value unlock** — connects education, storytelling, and physical products.
5. **YouTube (@ClipArtAnimation) is the distribution multiplier** — build the product first, then the channel.
6. **esy.com is a strong secondary bet** — different audience, shared infra, research-first architecture is genuinely differentiated.
7. **Don't split focus too early.** clip.art first, esy.com second. Concentration compounds.
