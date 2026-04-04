# BUG-003: Community Feed Only Shows Latest Generation, Replacing Previous Ones

**Status**: Resolved
**Severity**: Medium (user loses visual feedback of their work)
**Affected Page**: `/create`
**Date Reported**: April 3, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. User generates multiple images in quick succession on `/create`
2. Each new generation appears at the top of the Community Creations feed
3. But the **previous** new generation disappears — only the latest one is visible
4. After a full page refresh, all generations appear correctly
5. Screenshot shows 3 completed jobs in the queue but only 1 new image in the feed

## Root Cause: Side Effect Inside `useMemo`

The `CommunityGrid` component merged new generations from the Zustand store with the initial community API response using a `useMemo`:

```typescript
const fetchedIdsRef = useRef<Set<string>>(new Set());

// During API fetch:
fetchedIdsRef.current = new Set(merged.map((m) => m.id));

// Inside useMemo:
const items = useMemo(() => {
  const newFromStore = storeGenerations.filter(
    (g) => g.id && g.image_url && !fetchedIdsRef.current.has(g.id),
  );
  if (newFromStore.length === 0) return communityItems;
  const combined = [...newFromStore, ...communityItems];
  newFromStore.forEach((g) => fetchedIdsRef.current.add(g.id));  // BUG
  return combined;
}, [storeGenerations, communityItems, loading]);
```

The critical bug is on the line marked `// BUG`. This mutates `fetchedIdsRef.current` as a **side effect inside `useMemo`**. Here's the sequence:

1. **Generation A** completes → `storeGenerations` updates → `useMemo` runs
   - `newFromStore` = `[A]` (A is not in `fetchedIdsRef`)
   - Combined = `[A, ...community]`
   - Side effect: `fetchedIdsRef.current.add(A.id)` ← A is now in the ref

2. **Generation B** completes → `storeGenerations` updates → `useMemo` runs
   - `newFromStore` = `[B]` only — A is filtered out because `fetchedIdsRef.current.has(A.id)` is now `true`
   - Combined = `[B, ...community]` ← **A is gone**

3. Repeat for C, D, etc. — each new generation evicts the previous one

### Why This Violates React's Rules

`useMemo` must be a **pure computation** — no side effects. React may call it any number of times and expects the same inputs to produce the same outputs. Mutating a ref inside `useMemo` creates state that persists between invocations but isn't tracked by the dependency array, leading to stale or incorrect derivations.

## Fix

Replace the ref-based dedup with a pure computation. On each `useMemo` run, build a fresh `Set` from `communityItems` (the API response):

```typescript
const items = useMemo(() => {
  if (loading) return [];
  const communityIds = new Set(communityItems.map((c) => c.id));
  const newFromStore = storeGenerations.filter(
    (g) => g.id && g.image_url && !communityIds.has(g.id),
  );
  if (newFromStore.length === 0) return communityItems;
  return [...newFromStore, ...communityItems];
}, [storeGenerations, communityItems, loading]);
```

Now the computation is pure:
- `communityIds` is rebuilt from `communityItems` on every run — no stale ref
- `newFromStore` correctly includes **all** generations not already in the community API response
- No side effects, no ref mutation

The `fetchedIdsRef` was removed entirely since it's no longer needed.

## Performance Consideration

Rebuilding a `Set` from `communityItems` on every memo run might seem wasteful, but:
- `communityItems` is typically 20-40 items (the API returns the latest community page)
- `Set` construction from an array of 40 strings is ~microseconds
- This runs only when `storeGenerations`, `communityItems`, or `loading` changes — not on every render
- The alternative (tracking IDs in a ref) was the source of the bug

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/create/page.tsx` | Replaced ref-based dedup in `useMemo` with pure `Set` computation; removed `fetchedIdsRef` |

## Lessons

1. **Never put side effects in `useMemo` or `useCallback`** — these must be pure. If you need side effects from derived state, use `useEffect`.
2. **Refs are invisible to React's rendering model** — mutating a ref doesn't trigger re-renders, and reading a ref inside `useMemo` creates an untracked dependency that breaks memoization guarantees.
3. **Prefer pure derivations over mutable tracking** — rebuilding a `Set` on each run is trivially cheap and eliminates an entire class of bugs. The "optimization" of caching IDs in a ref was actually the root cause.
4. **Test with rapid successive operations** — the bug only manifests when multiple generations complete before a page refresh. Single-generation testing would never catch this.
