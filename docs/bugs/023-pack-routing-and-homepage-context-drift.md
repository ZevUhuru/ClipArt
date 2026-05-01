# Bug 023 — Pack Routing and Homepage Context Drift

**Date:** 2026-05-01
**Status:** Fixed — data repaired, shared routing helper added
**Severity:** High — public homepage CTAs could route users to the wrong themed pack
**Affected files:**
- `app/page.tsx`
- `app/(app)/packs/page.tsx`
- `app/design-bundles/page.tsx`
- `src/components/packs/PackCard.tsx`
- `src/data/packArtwork.ts`
- `src/lib/packRoutes.ts`
- `db/fix-kawaii-christmas-pack-taxonomy.sql`

---

## Symptoms

While promoting sealed-pack artwork on the homepage, the Kawaii Christmas
pack card still routed through a Mother's Day URL. Other homepage sections
also showed clip art that did not match the surrounding section context,
for example unrelated catalog art appearing under use-case or product
sections.

The visible result was a trust problem:

- A Christmas/Kawaii pack CTA pointed at a Mother's Day slug.
- Pack links were assembled differently across surfaces.
- Homepage modules looked visually polished but semantically loose.
- The Kawaii sealed-pack artwork was selected by fuzzy text matching,
  which could attach the artwork to the wrong future pack.

---

## Root Causes

### 1. Bad Pack Data

The live Kawaii pack row had contradictory taxonomy:

| Field | Bad value |
|-------|-----------|
| `title` | `Kawaii Christmas` |
| `slug` | `mothers-day-moj2hb35` |
| `tags` | `["kawaii", "christmas"]` |
| `category_id` | `NULL` |

Because public URLs use `packs/{category}/{slug}`, the wrong slug made the
homepage appear to link to Mother's Day even though the card image and title
were Christmas-themed.

### 2. Ad Hoc Pack URL Builders

Multiple files manually built pack URLs with:

```ts
`/packs/${pack.categories?.slug || "all"}/${pack.slug}`
```

That logic is insufficient now that character packs can have canonical
routes like `/packs/characters/{slug}` even when their underlying DB category
is different or not yet modeled as a normal pack category.

### 3. Fuzzy Artwork Matching

The Kawaii sealed-pack artwork initially matched on broad text:

```ts
text.includes("kawaii") && (
  text.includes("dessert") ||
  text.includes("desert") ||
  text.includes("christmas")
)
```

That was useful for a quick visual check, but it is not safe as a durable
pack identity rule. A future "Kawaii Mother's Day" or "Kawaii Birthday" pack
could accidentally inherit the Christmas dessert wrapper.

### 4. Homepage Visuals Used Generic Slices

The homepage originally pulled a small pool of recent/featured clip art and
then used arbitrary offsets:

```ts
takeVisuals(visualImages, 17, 12)
takeVisuals(visualImages, product.title.length, 3)
```

Those offsets made sections look full, but they did not guarantee that the
shown art matched the section promise. This was a structural content-selection
bug, not a styling bug.

---

## Fixes Shipped

### Data Repair

The Kawaii pack was updated in production and the repair was recorded as SQL:

```sql
update packs
set
  slug = 'kawaii-christmas',
  category_id = (
    select id
    from categories
    where type = 'pack'
      and slug = 'holidays'
    limit 1
  )
where id = '723d9fa8-4b28-457a-967e-ef758cd241c1';
```

The canonical public URL is now:

```txt
/packs/holidays/kawaii-christmas
```

### Shared Pack Routing

Added `src/lib/packRoutes.ts`:

```ts
export function packCategorySlug(pack: PackRouteCandidate) {
  return getCharacterForPack(pack)?.primaryCategorySlug || pack.categories?.slug || "all";
}

export function packPath(pack: PackRouteCandidate) {
  return `/packs/${packCategorySlug(pack)}/${pack.slug}`;
}
```

Updated homepage, pack cards, pack storefront hero, and design-bundles links
to use `packPath()` instead of local string interpolation.

### Exact Artwork Mapping

Changed the Kawaii sealed-pack override to exact slug matching:

```ts
matches: (pack) => pack.slug === "kawaii-christmas"
```

Character pack artwork still comes from the character registry for V1, but
non-character pack artwork overrides should be tied to stable pack identity,
not broad title/tag heuristics.

### Context-Aware Homepage Sections

The homepage now fetches a larger clip-art pool and uses section-specific
terms for visual selection:

- Use cases define `visualTerms`.
- Secondary product cards define `visualTerms`.
- Prompt discovery uses the prompt examples as selection context.
- Quality facts select from terms related to reusable, transparent, styled
  clip art.

Generic fallback slices were removed from contextual sections so unrelated
art does not silently fill a module.

---

## Prevention Rules

- Pack links must use `packPath()` unless a page is intentionally linking to
  a pack category hub.
- Sealed-pack artwork overrides must match a stable identifier such as pack
  slug or a future DB-backed artwork relationship. Avoid fuzzy title/tag
  matching for durable routing or artwork decisions.
- Homepage section visuals should be selected from explicit context, not by
  arbitrary offsets into a global image array.
- When creating packs through admin or Pack Studio, slug/category should be
  reviewed before publishing. A themed pack with `category_id = NULL` should
  be treated as incomplete metadata, not a valid public state.

---

## Follow-Up

- Move pack artwork overrides into the DB once sealed-pack images become a
  first-class pack field.
- Add a publish-time validation that warns on mismatched title/slug/category
  signals such as a Christmas tag with a Mother's Day slug.
- Consider adding a canonical redirect from stale pack slugs if old URLs have
  already been indexed or shared.
