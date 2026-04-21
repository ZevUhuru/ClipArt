# 00 · Overview

## What is ESY

ESY is the generation infrastructure for all ESY LLC products, starting with clip.art.

It owns the full lifecycle of every AI-generated artifact:

1. **Define** — Accept a generation request (subject, style, content type, quantity).
2. **Route** — Pick the best provider/model/quality tier for the job.
3. **Generate** — Execute against AI providers with retries and rate-limit awareness.
4. **Process** — Convert, compress, and store (WEBP via sharp, R2).
5. **Classify** — Enrich with title, description, slug, category, tags.
6. **Score** — Automated quality checks (background, isolation, resolution, safety).
7. **Review** — HITL queue for borderline outputs.
8. **Deliver** — Return approved artifact URL + metadata to the caller.

## What ESY doesn't do

- Track artifact performance after delivery (sales, clicks, conversions)
- Integrate with marketplaces (Etsy, Shopify, Amazon)
- Display, monetize, or route user traffic
- Provide analytics about downstream usage

ESY's job ends at "quality-approved artifact delivered." Everything beyond that is the consumer's domain.

## What clip.art becomes

Post-migration clip.art is a **pure consumer**:

- UI, routing, auth, credits, SEO, display — unchanged
- Generation logic, provider calls, image processing, storage — all removed
- Single outbound call: `POST {ESY_API_URL}/generate` with `{ subject, style, content_type }`, gets back `{ image_url, title, slug, description, category, ... }`
- No more `OPENAI_API_KEY`, `GEMINI_API_KEY`, `R2_*` in clip.art env — only `ESY_API_KEY` + `ESY_API_URL`

See [01-architecture.md](01-architecture.md) for the boundary diagram.

## Why migrate

1. **Eliminate duplication** — Generation logic currently lives in clip.art, would need to be re-built in every future ESY consumer (esy.com, external API customers).
2. **Fix known pipeline issues** — 16 documented gaps in the current clip.art pipeline (no retries, no HITL, no variation tracking, no cost controls, no quality scoring). See [03-migration-plan.md](03-migration-plan.md#known-pipeline-issues).
3. **Enable the ESY dashboard** — `app.esy.com` needs a real API to drive. Migrating clip.art to call that API means the dashboard is battle-tested on clip.art's production traffic before being opened to external users.
4. **Cost controls** — Provider-side cost tracking, batch API (50% off) routing, budget caps per schedule.
