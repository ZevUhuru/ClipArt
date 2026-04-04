# BUG-002: Credit Purchase Redirects Away from Workspace, Losing All Context

**Status**: Resolved
**Severity**: High (user loses work in progress, forced to redo setup)
**Affected Pages**: `/animate` (primary), all pages using `BuyCreditsModal`
**Date Reported**: April 3, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. User loads an image in the Animation Studio (`/animate?id=...`)
2. User writes or selects a prompt, configures model/duration/audio
3. User clicks "Animate" — the API returns 402 (insufficient credits)
4. Buy Credits modal opens, user purchases a pack via Stripe
5. After successful Stripe checkout, user is redirected to `/create` — **not** back to the Animation Studio
6. All workspace context is lost: source image, prompt text, model selection, duration, audio toggle
7. User must navigate back to `/animate`, re-import the image, and re-enter all settings

## Root Cause

Two compounding issues:

### 1. Hardcoded Stripe Return URLs

The checkout API route (`app/api/credits/checkout/route.ts`) used hardcoded URLs:

```typescript
success_url: `${appUrl}/create?success=true`,
cancel_url: `${appUrl}/create`,
```

Regardless of which page the user was on when they triggered the purchase, Stripe always redirected back to `/create`. This was written when `/create` was the only generation page — it was never updated when `/animate` and `/edit` were added.

### 2. No State Persistence Across Page Navigation

The Animation Studio stores all workspace state (prompt, model, duration, audio) in React `useState` hooks. These are destroyed when the browser navigates to Stripe and back. Even if the URL was correct, the prompt and settings would be lost because:

- React state doesn't survive full page navigations
- The prompt text entered by the user is not in the URL (only the `?prompt=` param from template links)
- Model, duration, and audio selections are never serialized anywhere

## Fix

### Layer 1: Dynamic Stripe Return URLs

`BuyCreditsModal` now captures the current `pathname` + search params and sends it as `returnPath` to the checkout API:

```typescript
const currentPath = searchParams?.toString()
  ? `${pathname}?${searchParams.toString()}`
  : pathname;

body: JSON.stringify({ packId, returnPath: currentPath })
```

The API validates it's a relative path (starts with `/`) and uses it for both `success_url` and `cancel_url`:

```typescript
const safePath = typeof returnPath === "string" && returnPath.startsWith("/")
  ? returnPath : "/create";

success_url: `${appUrl}${safePath}${separator}success=true`,
cancel_url: `${appUrl}${safePath}`,
```

This means `/animate?id=abc123` → Stripe → back to `/animate?id=abc123&success=true`. The source image reloads from the `id` param.

### Layer 2: Session Draft Persistence

When the 402 response triggers the credit modal, the animate page saves a draft to `sessionStorage`:

```typescript
sessionStorage.setItem("animate:draft", JSON.stringify({
  sourceId, prompt: prompt.trim(), model, duration, audio
}));
```

On page load, each piece of state checks for a matching draft:

```typescript
const [prompt, setPrompt] = useState(() => {
  if (initialPrompt) return initialPrompt;  // URL param takes priority
  const saved = sessionStorage.getItem("animate:draft");
  if (saved) {
    const draft = JSON.parse(saved);
    if (draft.sourceId === sourceId) return draft.prompt || "";
  }
  return "";
});
```

The draft is keyed by `sourceId` — if the user returns to a different image, stale data doesn't apply. The draft is cleaned up after a successful animation submission.

### Security Consideration

The `returnPath` is validated server-side to ensure it starts with `/` — this prevents open redirect attacks where a malicious payload could redirect to an external URL after checkout.

## Files Changed

| File | Change |
|------|--------|
| `app/api/credits/checkout/route.ts` | Accept `returnPath`, use it for Stripe `success_url` and `cancel_url` |
| `src/components/BuyCreditsModal.tsx` | Capture current path via `usePathname` + `useSearchParams`, send as `returnPath` |
| `app/(app)/animate/page.tsx` | Save draft to `sessionStorage` on 402, restore on mount, clear on success |

## Lessons

1. **Never hardcode return URLs in payment flows** — always capture the originating context. Any page can trigger a purchase.
2. **Critical user input needs persistence** — if a user has spent time configuring something (writing a prompt, selecting options), that work should survive interruptions. `sessionStorage` is ideal for ephemeral drafts that only need to last one browser session.
3. **Test the full purchase loop** — the happy path (has credits → animate) was tested, but the credit-acquisition loop (no credits → buy → return → animate) was never exercised end-to-end.
4. **URL params are the first layer of persistence** — the `?id=` param already survived the redirect; the fix leveraged this by making Stripe return to the full URL instead of a hardcoded one.
