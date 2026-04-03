# Mobile Viewport & Safe Areas

## The Problem

On mobile browsers (especially iOS Safari), the bottom navigation bar doesn't reliably stick to the bottom of the screen. Content can get hidden behind it, or there's an awkward gap between the nav and the actual screen edge on notched devices.

## Root Cause: `100vh` Lies on Mobile

Desktop browsers define `100vh` as the viewport height — straightforward. Mobile browsers don't.

When you visit a page on iOS Safari, the address bar is visible (smaller viewport). As you scroll, the address bar collapses (larger viewport). But `100vh` is always computed as the **larger** viewport — even when the address bar is showing. This means:

- `min-h-screen` (`min-height: 100vh`) creates a container taller than the visible area
- `fixed bottom-0` elements can get pushed below the visible fold when the address bar is up
- Content with `height: 100vh` overflows and causes scroll bounce

### The Timeline of Solutions

| Unit | Behavior | Browser Support |
|------|----------|----------------|
| `vh` | Static — always the largest viewport | Universal |
| `svh` | Static — always the smallest viewport (address bar visible) | 2022+ |
| `lvh` | Static — always the largest viewport (same as `vh`) | 2022+ |
| **`dvh`** | **Dynamic — tracks the actual current viewport** | 2022+ |

**`dvh` is the correct choice** for most mobile layouts. It dynamically adjusts as the browser chrome appears/disappears.

```css
/* Bad — overflows when address bar is visible */
.container { min-height: 100vh; }

/* Good — tracks the real viewport */
.container { min-height: 100dvh; }
```

Tailwind provides `min-h-dvh` as a utility class.

## Safe Area Insets

Modern phones have non-rectangular screens — notches (iPhone 14), Dynamic Islands (iPhone 15+), and home indicators (all Face ID iPhones). Content in the corners or at the bottom edge gets obscured.

CSS provides `env()` variables for the "safe" content region:

```
env(safe-area-inset-top)     — notch / Dynamic Island
env(safe-area-inset-bottom)  — home indicator bar
env(safe-area-inset-left)    — landscape left edge
env(safe-area-inset-right)   — landscape right edge
```

### Enabling Safe Area Insets

These `env()` values are **all zero by default**. You must opt in via the viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

In Next.js, this is done via the `viewport` export:

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",  // This enables env(safe-area-inset-*)
};
```

Without `viewport-fit=cover`, the browser adds its own padding and the `env()` values stay at `0`.

### Using Safe Area Insets

For a fixed bottom navigation:

```css
nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Nav sits above the home indicator */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

For main content that needs to clear the nav:

```css
main {
  /* nav height + safe area + breathing room */
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.5rem);
}

@media (min-width: 768px) {
  main {
    padding-bottom: 0; /* Desktop has sidebar, no bottom nav */
  }
}
```

## What We Fixed

| File | Change | Why |
|------|--------|-----|
| `app/layout.tsx` | Added `viewport` export with `viewportFit: "cover"` | Enables `env(safe-area-inset-*)` on iOS |
| `AppMain.tsx` | `min-h-screen` → `min-h-dvh` | Tracks dynamic viewport on mobile |
| `AppBottomNav.tsx` | Added `padding-bottom: env(safe-area-inset-bottom)` | Nav clears home indicator |
| `globals.css` | `.mobile-main` class with calc-based padding | Content clears nav + safe area |
| `app/(app)/layout.tsx` | Root wrapper uses `min-h-dvh` | Consistent with inner layout |

## Key Takeaways

1. **Always use `dvh` instead of `vh`** for mobile-facing layouts
2. **Always set `viewport-fit=cover`** in Next.js via the `viewport` export — without it, safe area insets are always zero
3. **Fixed bottom elements need `env(safe-area-inset-bottom)`** padding
4. **Main content needs padding** equal to the bottom nav height + safe area
5. **Desktop overrides reset padding to 0** — the sidebar replaces the bottom nav
6. **Test on real iOS devices** — simulators sometimes don't reproduce the address bar behavior accurately
