# OPT-003: Mobile Viewport `dvh` Migration

**Area**: CSS / Layout
**Pages**: All app pages (via `AppMain` and `AppBottomNav`)
**Date**: April 4, 2026

## Before

The app layout used `min-h-screen` (which compiles to `min-height: 100vh`) for the main content area and outer wrapper. On mobile browsers:

- `100vh` represents the **largest possible viewport** (address bar hidden)
- When the address bar is visible (initial page load, scroll-to-top), the actual viewport is smaller than `100vh`
- This caused content to overflow, scroll bounce, and the bottom nav to sit below the visible fold
- No `viewport-fit=cover` meta tag meant `env(safe-area-inset-*)` values were all `0px` on notched devices
- Bottom nav overlapped the home indicator on Face ID iPhones

## After

### Viewport Meta

Added Next.js `viewport` export with `viewportFit: "cover"`:

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};
```

This enables `env(safe-area-inset-*)` CSS functions on iOS.

### Dynamic Viewport Height

Replaced `min-h-screen` (`100vh`) with `min-h-dvh` (`100dvh`) on `AppMain` and the app layout wrapper. `dvh` dynamically tracks the actual visible viewport as the browser chrome appears/disappears.

### Safe Area Padding

Bottom nav now adds `padding-bottom: env(safe-area-inset-bottom)` so it clears the home indicator. Main content padding accounts for the nav height + safe area:

```css
.mobile-main {
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.5rem);
}
@media (min-width: 768px) {
  .mobile-main { padding-bottom: 0; }
}
```

## Impact

- **Bottom nav**: Reliably sticks to the visible bottom edge on all mobile browsers
- **Home indicator**: Nav content sits above the safe area on notched devices
- **Address bar**: Layout adjusts dynamically as browser chrome appears/disappears
- **No layout shift**: Content doesn't overflow or cause scroll bounce on initial load

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Added `viewport` export with `viewportFit: "cover"` |
| `src/components/AppMain.tsx` | `min-h-screen` → `min-h-dvh`, added `mobile-main` class |
| `src/components/AppBottomNav.tsx` | Added `padding-bottom: env(safe-area-inset-bottom)` |
| `src/styles/globals.css` | Added `.mobile-main` class with safe-area-aware padding |
| `app/(app)/layout.tsx` | Root wrapper uses `min-h-dvh` |
