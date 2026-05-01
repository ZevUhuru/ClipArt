# Distribution and Sharing

## Decision

Social sharing and marketplace publishing belong in clip.art, not ESY.

ESY owns the production of high-quality artifacts. clip.art owns where those artifacts are shown, sold, shared, and converted.

This applies to:

- Sharing public bundles and generations to X, Instagram, Facebook, and Pinterest.
- Publishing design bundles to Etsy.
- Future marketplace or storefront integrations such as Shopify, Amazon, Gumroad, Creative Market, or Teachers Pay Teachers.

## Rationale

These features happen after the artifact has been delivered. They depend on user-facing product context that ESY should not know about:

- Public URLs, canonical paths, and SEO metadata.
- Visibility rules: public, unlisted, private, pack-exclusive.
- Bundle pricing, purchase state, license copy, and checkout CTAs.
- Creator-owned drafts, publishing readiness, and editorial review.
- Social captions, UTM parameters, attribution, and conversion paths.
- Marketplace-specific listing fields, taxonomy choices, shop credentials, and publishing status.

Putting this layer in ESY would blur the boundary between generation infrastructure and consumer commerce. ESY would start needing to understand clip.art routes, pack visibility, seller workflows, share copy, marketplace categories, and downstream conversion behavior. Those are clip.art concerns.

The durable boundary is:

```text
ESY
- Generate artifact
- Process and store media
- Enrich with title, description, tags, category, and quality metadata
- Return stable artifact URLs and provenance

clip.art
- Public artifact and bundle URLs
- Social sharing UI and metadata
- Marketplace publishing workflows
- Commerce, licensing, visibility, attribution, and analytics
```

## Social Sharing Expectations

clip.art should expose sharing from public bundle pages, public generation detail pages, and any user-owned generation that has been explicitly made public or unlisted.

Expected channels:

- **X:** Web intent URL with text, canonical URL, and UTM parameters.
- **Facebook:** Share dialog URL using the canonical page URL and Open Graph metadata.
- **Pinterest:** Pin creation URL using the canonical page URL, media URL, title, and description.
- **Instagram:** No reliable direct web publishing flow for feed posts. Support mobile Web Share where available, plus download image, copy caption, and copy link fallbacks.

Required clip.art-owned pieces:

- Canonical page URL for every shareable bundle or generation.
- Strong Open Graph and X/Twitter metadata.
- Pinterest-friendly media URL, preferably the primary cover or selected image.
- Share controls with descriptive accessible names.
- Visibility gate so private and pack-exclusive assets are never accidentally shared.
- UTM tagging for channel attribution.

ESY may support social sharing indirectly by returning richer artifact metadata or derivative preview renditions, but it should not create share links, know platform rules, or track downstream engagement.

## Etsy Publishing Expectations

Etsy has Open API v3 support for shop management, draft listings, listing images, inventory, and digital download files. Digital products are created as listings with `type=download`, and the downloadable ZIP is attached through the listing file API.

V1 should be **Export to Etsy draft**, not auto-publish:

1. The user connects an Etsy shop through OAuth 2.
2. Pack Studio validates that the pack is publish-ready.
3. clip.art creates an Etsy draft listing from the pack metadata.
4. clip.art uploads listing images or mockups.
5. clip.art uploads the pack ZIP as the digital download file.
6. clip.art stores the Etsy listing id and export status.
7. The user reviews and publishes the listing in Etsy.

This keeps the first version compliant and preserves editorial control before money changes hands.

Important constraints:

- A personal Etsy app can be enough for publishing to ESY's own shop.
- Letting arbitrary clip.art users connect and publish to their own shops requires Etsy commercial access approval.
- Etsy credentials, OAuth tokens, shop ids, listing ids, and export status belong in clip.art.
- ESY should not hold marketplace credentials or call marketplace APIs.

## Future Ownership

### clip.art

clip.art should own the end-to-end distribution product:

- Share buttons and share copy for bundles and generations.
- Public/unlisted share pages.
- Pack Studio marketplace export UI.
- Etsy OAuth connection, token refresh, and shop selection.
- Etsy draft listing creation, listing image upload, ZIP upload, price/tags/taxonomy mapping, and export status.
- Future marketplace adapters and a shared internal publishing interface.
- Downstream analytics such as share clicks, Etsy export success, marketplace sales imports, and conversion tracking if added later.

### ESY

ESY should remain a clean artifact production service:

- Generate, process, store, score, and return approved artifacts.
- Produce stable media URLs suitable for clip.art to use in pages and exports.
- Return title, description, tags, category, dimensions, format, transparency, model, and provenance.
- Optionally produce derivative preview assets when requested by a consumer, such as a square social preview, bundle cover candidate, or marketplace mockup source image.
- Never own public route construction, social share links, marketplace publishing, shop credentials, commerce state, or downstream performance tracking.

If a future consumer besides clip.art wants to publish to Etsy, that consumer should implement its own distribution layer on top of ESY's artifact API.

