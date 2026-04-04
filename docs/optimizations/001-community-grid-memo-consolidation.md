# OPT-001: CommunityGrid Memo Consolidation

**Area**: React rendering
**Page**: `/create`
**Date**: April 4, 2026

## Before

The `CommunityGrid` component had three separate computation steps that ran on every render:

```
useMemo → items (merge store + community)
         ↓ (every render, not memoized)
.filter() → safeItems (remove items without id/image_url)
         ↓ (every render, not memoized)
.map()   → drawerList (transform to DrawerImage shape)
         ↓ (every render, inside JSX .map())
{ id, slug, title, url, ... } → img object per card (duplicate of drawerList mapping)
```

**Problems:**
1. `safeItems` filter ran on every render — O(n) work outside of memoization
2. `drawerList` mapping ran on every render — O(n) work outside of memoization
3. Each card's `img` object was an identical duplicate of the corresponding `drawerList` entry — same mapping logic written twice, both running on every render
4. Total: 4 array passes per render (memo merge + filter + drawerList map + JSX map with object creation)

## After

Single consolidated `useMemo` returns both `safeItems` and `drawerList`:

```
useMemo → merge → filter → map to drawerList
       ↓
{ safeItems, drawerList }  (both memoized)
       ↓
JSX uses drawerList[idx] directly (no per-card object creation)
```

A `toDrawerImage` helper eliminates the duplicate mapping:

```typescript
function toDrawerImage(gen: CommunityItem) {
  return {
    id: gen.id,
    slug: gen.slug || gen.id,
    title: gen.prompt,
    url: gen.image_url,
    category: gen.category || "free",
    style: gen.style,
    aspect_ratio: gen.aspect_ratio,
    videoUrl: gen.animationPreviewUrl,
  };
}
```

**Improvements:**
1. Filter + map consolidated into memo — runs only when dependencies change, not every render
2. Duplicate object mapping eliminated — single `toDrawerImage` function
3. Render loop references pre-computed `drawerList[idx]` — zero object allocation per card per render
4. Total: 1 memoized pass (merge + filter + map), 1 JSX pass (reference only)

## Impact

- **Render passes**: 4 → 2 (one memoized, one JSX reference)
- **Object allocations per render**: O(2n) → O(0) for the drawer/image mapping (memoized)
- **Code duplication**: Eliminated identical 8-property object literal written in two places
- **Correctness**: Also fixed BUG-003 (side effect inside useMemo) as part of this refactor

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/create/page.tsx` | Consolidated memo, extracted `toDrawerImage`, removed unmemoized computations |
