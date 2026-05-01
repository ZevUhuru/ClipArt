# Pack Studio V1

## Goal

Pack Studio turns `/create/packs` from a simple grouping tool into a seller-grade workspace for creating, pricing, generating, organizing, and publishing commercial clip art bundles.

The product promise:

> Create a cohesive, commercially useful clip art bundle from brief to ZIP.

Distribution strategy lives in `docs/features/DISTRIBUTION_AND_SHARING.md`. Pack Studio owns downstream bundle publishing and sharing workflows, including Etsy draft export. ESY remains the artifact generation layer and should not integrate with social platforms or marketplaces.

The long-term content strategy lives in `docs/features/BUNDLE_FIRST_STRATEGY.md`. Once clip.art has at least 100 high-quality published packs, packs should become the primary homepage, catalog, sharing, and marketplace unit. Standalone clip art remains important, but it should increasingly act as pack-attached inventory and SEO depth.

`/packs` is the storefront and browse/download surface. `/design-bundles` is the higher-level marketing landing page for the bundle creation and distribution product. Pack Studio is the creator surface.

```mermaid
flowchart LR
  PackStudio["Pack Studio"] --> Brief["Brief, SEO, Pricing"]
  PackStudio --> Generate["Generate Pack Assets"]
  PackStudio --> Canvas["Organize, Cover, Quality"]
  Canvas --> Publish["Publish ZIP"]
  Publish --> Storefront["Packs Storefront"]
  Storefront --> Checkout["Checkout and Download"]
```

## Current Foundation

The workspace lives in `app/(app)/create/packs/page.tsx`. It already supports:

- Creating a pack draft.
- Editing title, description, category, tags, and visibility.
- Adding assets from a user's library.
- Adding assets from the public catalog.
- Batch generating new clip art into a pack.
- Selecting a cover from pack items.
- Publishing and rebuilding the downloadable ZIP.

The schema from `db/add-packs.sql` already includes core commerce and publish fields:

- `is_free`
- `price_cents`
- `stripe_price_id`
- `zip_status`
- `zip_url`
- `item_count`
- `visibility`
- `is_published`

`pack_items.is_exclusive` also exists, but the creator UI does not expose it yet.

## V1 Scope

### Seller-Grade Metadata

Pack metadata should support both app organization and public selling:

- `audience`
- `pack_goal`
- `description` as the short/card summary
- `long_description` for SEO and marketing
- `whats_included`
- `use_cases`
- `license_summary`

The short description should remain concise. Long descriptions belong in their own field so the public pack detail page can rank and convert without making the workspace summary unreadable.

### Pricing

Creator pricing should support simple one-off bundle sales:

- Free/Paid toggle.
- Regular price.
- Optional compare-at price.
- Optional launch price.
- Optional launch end date.

Keep coupons, discount codes, and complex price history out of V1.

Initial guidance:

- 20-item standard pack: `$5-$7`
- 50-item cohesive premium pack: `$9-$12`
- 50-item pack with templates/printables: `$15-$19`
- 100+ hero pack: `$19-$29`

### Cover Control

Auto-cover is useful as a fallback, but creators need obvious control:

- Current cover shown clearly in the left summary.
- Asset cards expose an obvious `Set cover` action.
- Support clearing the explicit cover to return to automatic cover selection.

Defer custom cover uploads, cover cropping, and generated cover collages until after V1.

### Pack-Exclusive Assets

Generated pack assets should default to pack-exclusive so paid bundles do not feel like repackaged public catalog content.

Creator-facing labels:

- **Pack-exclusive**: only sold/downloaded inside this pack.
- **Reusable in my packs**: can be reused across the creator's bundles.
- **Public catalog**: can appear in public search/browse.

V1 should use `pack_items.is_exclusive` for pack exclusivity. If the app needs a separate generation-level availability flag, add it conservatively.

### Batch Generation UX

The current batch generation area should feel like a pack asset planner, not an internal prompt dump.

Replace unclear language like `Generate (Pack-Aware)` with:

- Tab: `Generate`
- Panel title: `Generate assets for this pack`
- Helper copy: `Add one idea per row. We'll use your pack brief, audience, style, and settings to keep the images consistent.`

Replace the single textarea with a row-based batch builder:

- Default prompt rows.
- `+ Add idea` button.
- Remove row action.
- Optional item title per row.
- `Paste list` support for newline-separated ideas.
- Count derived from rows.
- Advanced setting for variations per idea.

Advanced controls should include:

- Model selection with `Recommended` as the default.
- Full clip art style list from `src/lib/styles.ts`.
- Variations per idea.
- Background/transparency target.
- Default asset availability.
- Shared style notes.
- Avoid list if supported.
- Keep-cohesive toggle.

Model IDs must remain explicit and must not use floating aliases such as `latest`, `auto`, or generic marketing aliases.

### Character Reference Sheet Workflow

Character sheet packs should behave like a first-class Pack Studio workflow. See `docs/features/PACK_STUDIO_CHARACTER_REFERENCE_SHEETS.md` for the full plan.

Character packs also feed the public character strategy in `docs/features/BUNDLE_FIRST_STRATEGY.md`: `/packs/characters` is the pack category for character bundles, while `/characters` and `/characters/[slug]` are public character IP pages that gather reference sheets, packs, coloring pages, worksheets, and future related artifacts.

V1 should keep the implementation scoped to Pack Studio:

- The `Consistent Character Sheet Pack` starter preloads editable reference-sheet rows.
- Character sheet packs route `Recommended` generation to `gpt-image-2`.
- The prompt builder adds reference-board guidance for consistent identity, turnarounds, expressions, poses, and detail callouts.
- The Generate tab exposes a setup callout so existing character sheet packs can apply the preset without recreating the pack.
- This should not change the global style router because normal clip art packs still optimize for volume generation.

### Current Generation State Recovery

Pack Studio currently uses the synchronous batch generation API at `app/api/generate/batch/route.ts`. The request does not expose per-image server-side progress while it runs, so the workspace cannot yet show true completed/failed status for each asset in real time.

The current fix in `app/(app)/create/packs/page.tsx` improves the user experience around that limitation:

- When a pack batch is submitted, the client persists a pending queue record in `localStorage`.
- The record includes the pack id, start time, expected item count, initial pack item count, and queued prompt labels.
- Pack Studio submits one queued asset per request to `/api/generate/batch`, with `variationsPerIdea: 1`, so slow models such as `gpt-image-2` do not spend a whole multi-image batch inside one server request.
- If the user refreshes mid-generation, Pack Studio reopens the Generate tab and restores the queue as a recovery state.
- During recovery, the page polls the pack and refreshes the canvas when newly attached assets appear.
- If the recovery window expires, the UI tells the user it could not confirm completion and prompts them to check the pack or library.

This follows the same browser-owned queue pattern as `/create`, but keeps a Pack Studio-specific queue because each result must attach to a pack and honor pack-exclusive settings. It is intentionally lightweight and avoids introducing a new database/job system before the ESY migration is complete.

### Future Server-Side Generation Queue

The bulletproof version should be a real server-side pack generation job system.

Add a `pack_generation_jobs` table, or the ESY equivalent once generation moves behind `api.esy.com`, with per-image state:

- `id`
- `pack_id`
- `user_id`
- `status` (`queued`, `running`, `completed`, `partial`, `failed`, `cancelled`)
- `total_count`
- `completed_count`
- `failed_count`
- `credits_reserved`
- `credits_used`
- `settings` JSONB for model, style, variations, asset availability, shared notes, avoid list, and cohesion
- `created_at`, `started_at`, `completed_at`

Add child job rows, or a JSONB `items` payload, for each requested asset:

- source prompt row id
- prompt/title
- status
- generation id after success
- error message after failure
- timestamps

The Pack Studio UI should then poll or subscribe to the job id instead of simulating progress locally. That unlocks:

- Accurate per-image progress.
- Refresh-proof state without relying on `localStorage`.
- Resume/cancel/retry controls.
- Partial success display.
- Correct credit accounting for failed images.
- A durable audit trail for support and future seller workflow analytics.

This should likely land as part of the ESY generation migration rather than a deep refactor inside clip.art's transitional provider pipeline.

### Quality and Readiness

V1 readiness checks should be deterministic:

- Title present.
- Short description present.
- Long description present for public/paid packs.
- Category selected.
- At least 3 tags.
- Cover set.
- Price set for paid packs.
- Minimum 12 assets.
- 20 assets recommended.
- Transparent PNG coverage.
- Clip art only.
- ZIP state visible.

Avoid AI quality scoring in clip.art until ESY owns that layer.

### Public Detail Page

The design bundle detail page should render the selling copy:

- Short summary near purchase/download CTA.
- Long description.
- What's included.
- Use cases.
- License summary.
- Item count, transparent PNG, and commercial-use trust badges.

When a pack belongs to a named character, the detail page should reserve space for character context:

- Character reference sheet preview.
- Link to the canonical character page, such as `/characters/orion-foxwell`.
- Related character packs when available.

### Distribution and Sharing

Pack Studio should become the launch point for bundle distribution after a pack is ready:

- Share public bundle pages to X, Facebook, Pinterest, and Instagram-compatible mobile share flows.
- Provide copy-link, copy-caption, and download-image fallbacks for Instagram.
- Export publish-ready packs to Etsy as draft digital download listings.
- Track marketplace export status on the pack, including Etsy listing id and last export result.

This is deliberately clip.art-owned. Social channels and Etsy need public URLs, pack visibility, pricing, license copy, ZIP state, marketplace taxonomy, and seller review state. Those are downstream commerce and distribution concerns, not generation infrastructure.

ESY can help by returning clean artifact metadata and stable media URLs, but it should not call marketplace APIs, hold shop credentials, create social share links, or track downstream performance.

### Navigation

Separate creation from browsing:

- `/create/packs` should be labeled `Pack Studio`.
- `/packs` should be the browse/download storefront for ready-made packs.
- `/design-bundles` should be the marketing landing page for bundle creation, sharing, and marketplace export.
- The signed-in create navigation should point to Pack Studio, not the browse page.
- Library should expose Pack Studio because users manage assets and bundles together.

At the 100+ published pack threshold, homepage and category navigation should treat packs as the main discovery unit. Pack Studio remains the creation workspace; `/packs` remains the storefront.

## Not In V1

- Full seller storefronts.
- Coupon system.
- Complex discount scheduling.
- Sales analytics dashboard.
- Multi-user collaboration.
- AI quality scoring.
- Custom cover designer.
- Generated cover collage builder.
- Automated marketplace publishing without creator review.
- Marketplace integrations outside Etsy.
- Social scheduling or account-level social posting.

## Implementation Order

1. Add schema and API support for pack metadata, pricing fields, and availability.
2. Update Pack Studio metadata, pricing, cover, and long-description UI.
3. Redesign batch generation as a multi-row idea builder.
4. Wire pack-exclusive defaults through add/generate flows.
5. Add deterministic readiness checks.
6. Render long-form selling copy on public bundle detail pages.
7. Clarify navigation labels and routes.
8. Add character-aware pack detail modules for reference sheets and canonical character links.
9. Add share controls for public bundle pages.
10. Add Etsy draft export after pack readiness checks and ZIP generation are stable.
11. Run lint checks and focused manual flow checks.
