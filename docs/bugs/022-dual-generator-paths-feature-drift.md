# Bug 022 — Dual Generator Code Paths Cause Silent Feature Drift

**Date:** 2026-04-27
**Status:** Open — workaround shipped, refactor pending
**Severity:** High — every new generation feature is a hidden double-implementation trap
**Affected files:**
- `src/components/Generator.tsx` (homepage path)
- `src/stores/useGenerationQueue.ts` (in-app `/create` path)
- `app/api/generate/route.ts` (shared backend)

---

## Symptoms

While building the Prompt Library funnel tracking feature, attribution
(`source = "prompt_library"`, `prompt_library_use_id`) was correctly wired
through `Generator.tsx`. End-to-end testing on `/create` (the page where
the Prompt Library actually lives) showed:

- `prompt_library_uses` table received rows on every prompt click ✓
- `lastPromptLibraryUseId` was set in the Zustand store ✓
- `/api/generate` was being called normally ✓
- **But** every resulting `generations` row had `source = NULL`,
  `prompt_library_use_id = NULL`

Hours of debugging chased the wrong code path. The store was correct,
the backend was correct, the homepage `Generator` was correct — but
nothing on `/create` ever read the store.

---

## Root Cause

The app has **two parallel client-side paths to `/api/generate`** and
they have drifted independently:

| Path | File | Used by | Style |
|------|------|---------|-------|
| Single-shot | `src/components/Generator.tsx` | `app/page.tsx` (homepage hero) | Inline result, anonymous-friendly |
| Queue | `src/stores/useGenerationQueue.ts` `addJob()` | `app/(app)/create/page.tsx` and other in-app surfaces | Persistent queue cards, multi-job |

Both paths build their own `body: Record<string, unknown>` and POST it.
Any new field — `freeGen`, `aspectRatio`, `contentType`, `source`,
`promptLibraryUseId`, etc. — must be wired into **both** call sites or
that feature silently no-ops on whichever path was missed.

The Prompt Library attribution feature was wired into `Generator.tsx`
only. `/create` uses the queue, which had no concept of the prompt
library, so the source field never left the browser.

This is a **structural** problem, not a one-off bug. Every future
generation feature has the same trap waiting.

---

## Workaround Shipped

Commit `18ed912` — `useGenerationQueue.addJob` now reads
`lastPromptLibraryUseId` from the app store and threads it through the
request body. Patches the immediate symptom but leaves the underlying
duplication in place.

---

## Why This Took So Long to Find

1. The first bug-hunt assumption was "the store isn't populated" — we
   verified that path exhaustively (RLS, race condition, Vercel deploy
   timing) and shipped three separate fixes before realizing the store
   was fine.
2. There was no test or assertion that the queue path matches the
   `Generator` path.
3. There was no shared "build payload" function — each path has its
   own ad-hoc payload assembly.
4. `Generator.tsx` is no longer the primary surface, but it was where
   the new wiring went because it's the more discoverable file. The
   queue's `addJob` is buried in a Zustand store and easy to miss.

---

## Required Refactor — Single Source of Truth

Extract one function that owns the contract with `/api/generate`:

```ts
// src/lib/generation/submitGeneration.ts
export interface GenerationParams {
  prompt: string;
  style: string;
  isPublic?: boolean;
  freeGen?: boolean;
  aspectRatio?: string;
  contentType?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  // ... future fields land here exactly once
}

export async function submitGeneration(params: GenerationParams) {
  // Read prompt-library attribution from store
  // Build body
  // POST /api/generate
  // Clear attribution on success
  // Return typed response
}
```

Then:
- `Generator.tsx` becomes UI + `submitGeneration()`.
- `useGenerationQueue.addJob` becomes queue state management +
  `submitGeneration()`.
- New generation features are wired in **one place** and inherited by
  both surfaces automatically.

---

## Acceptance Criteria

- [ ] One function (or class) owns the request body construction for
  `/api/generate`.
- [ ] Both `Generator.tsx` and `useGenerationQueue.addJob` call it.
- [ ] No second place in the codebase builds a `Record<string, unknown>`
  for `/api/generate`.
- [ ] Add a unit test that snapshots the payload shape so future
  divergence fails CI.

---

## Severity Justification

This is filed High, not Medium, because:

- It silently kills features instead of throwing errors. We had a
  shipped, deployed, "working" tracking system that recorded zero data
  for hours.
- The same trap will fire on the next feature added — payments tagging,
  A/B test variants, model overrides, etc.
- Bug-hunting time is the most expensive output we have. This wasted
  multiple hours on a problem that should have been spotted in five
  minutes if the call sites were unified.

---

## Related

- Feature: `docs/features/PROMPT_LIBRARY.md`
- Feature: `docs/features/QUEUE_REDESIGN.md`
- Migration target: `docs/esy/04-migration-tracker.md` —
  `app/api/generate/route.ts` becomes a thin proxy to ESY. The
  unification should happen **before** that migration so the proxy
  swap is a single-call-site change.
