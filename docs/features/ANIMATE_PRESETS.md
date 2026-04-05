# Feature: Animation Studio Persistence & Saved Presets

**Date**: April 5, 2026
**Status**: Shipped

## Overview

The Animation Studio (`/animate`) now retains user state across browser sessions, shows the full control surface to new visitors on first load, and allows users to save and recall previous animation configurations via "Recent Setups."

## Problem Statement

Three user-facing issues drove this feature:

1. **Invisible capabilities**: The empty state (no image loaded) showed a blank placeholder with just 3 grayed-out template labels. New visitors couldn't see the quality tiers, duration controls, audio toggle, or prompt input — underselling the product.

2. **Lost prompts on refresh**: Animation prompts and settings disappeared when the user refreshed the page, because the draft was cleared after successful animation and `sessionStorage` doesn't survive tab close.

3. **Lost state on navigation**: Navigating to another page (My Creations, Create, etc.) and returning to `/animate` wiped all state. Closing the browser had the same effect. Users had to re-import images and re-type prompts.

## Solution

### 1. Empty-State Controls Preview

When no source image is loaded, the right column renders the full animation control panel in a muted, non-interactive state:

- Prompt textarea (disabled, with placeholder)
- Templates section (showing 6 templates + count of remaining)
- Quality selector (3 tiers with credit estimates)
- Duration slider (fixed at 5s)
- Audio toggle (disabled)
- Animate button (labeled "Select an image to animate")

All wrapped in `pointer-events-none opacity-50` to clearly communicate these are preview/disabled controls.

### 2. localStorage Persistence

Replaced `sessionStorage` with `localStorage` for the `animate:draft` key. The draft stores:

```typescript
{
  sourceId: string;   // generation ID from URL ?id= param
  prompt: string;
  model: string;      // "kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro"
  duration: number;   // 5-15 seconds
  audio: boolean;
}
```

Draft behavior:
- **Written**: Debounced 500ms after any form change
- **Read**: Once on page load via `useMemo`, only if `sourceId` matches URL param
- **Cleared**: On successful animate, on "Start over", and on sign out
- **Survives**: Browser close, new tabs, page navigation

### 3. Saved Presets (Recent Setups)

When the user successfully animates or clicks "Start over" (with a non-empty prompt), the current configuration is saved to `localStorage["animate:presets"]`.

#### Preset Data Model

```typescript
interface AnimatePreset {
  id: string;            // generated unique ID
  sourceId: string;      // generation ID for re-navigation
  sourceTitle: string;   // display name
  sourceThumb: string;   // image_url for thumbnail
  prompt: string;        // motion prompt text
  model: string;         // quality tier
  duration: number;      // seconds
  audio: boolean;        // audio enabled
  savedAt: number;       // timestamp
}
```

#### Storage Rules

- Maximum 10 presets (oldest evicted first)
- Duplicate detection: same `sourceId` + `prompt` replaces the older entry
- Cleared on sign out (prevents cross-account leakage)

#### UI Placement

**Empty state** (no image loaded):
- "Recent Setups" section above the disabled controls
- Collapsed: shows a horizontal scrollable row of compact preset chips (thumbnail + truncated prompt)
- Expanded: full detail cards with thumbnail, prompt, model, duration, audio, and delete button

**Active state** (image loaded):
- "Recent Setups" section between Templates and Quality, collapsed by default
- Expanding shows the same detail cards
- Clicking a preset replaces the current source and form state

#### Preset Interaction

Clicking a preset:
1. Navigates to `/animate?id={sourceId}` via `router.replace`
2. Sets prompt, model, duration, audio from the saved values
3. Writes a new draft to localStorage
4. Closes the presets panel (if in active state)

Deleting a preset:
- X button appears on hover for each card
- Uses `stopPropagation` to prevent triggering the load action
- Removes from localStorage and refreshes the list

### 4. Sign-Out Cleanup

`Providers.tsx` auth state change handler clears both keys on sign out:

```typescript
localStorage.removeItem("animate:draft");
localStorage.removeItem("animate:presets");
```

## State Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    /animate Page Load                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  URL has ?id= ──► Load source from DB                    │
│                   Read draft from localStorage           │
│                   Restore prompt/model/duration/audio     │
│                                                          │
│  No ?id= ───────► Show empty state with:                 │
│                   - Recent Setups (if any presets exist)  │
│                   - Disabled controls preview             │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    User Edits Form                        │
├─────────────────────────────────────────────────────────┤
│  Every change ──► Debounced 500ms write to               │
│                   localStorage["animate:draft"]           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                 User Clicks "Animate"                     │
├─────────────────────────────────────────────────────────┤
│  1. Save config to animate:presets                       │
│  2. Clear animate:draft                                  │
│  3. Reset prompt text                                    │
│  4. Dispatch animation job to queue                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                User Clicks "Start Over"                   │
├─────────────────────────────────────────────────────────┤
│  1. Save config to animate:presets (if prompt non-empty) │
│  2. Clear animate:draft                                  │
│  3. Reset all state                                      │
│  4. Navigate to /animate (no params)                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              User Clicks a Recent Setup                   │
├─────────────────────────────────────────────────────────┤
│  1. Navigate to /animate?id={sourceId}                   │
│  2. Restore prompt, model, duration, audio               │
│  3. Write new draft to localStorage                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    User Signs Out                         │
├─────────────────────────────────────────────────────────┤
│  Clear animate:draft + animate:presets from localStorage │
└─────────────────────────────────────────────────────────┘
```

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/animate/page.tsx` | localStorage persistence, preset save/load/delete helpers, Recent Setups UI (empty + active state), disabled controls preview |
| `src/components/Providers.tsx` | Clear animate localStorage keys on sign out |
| `docs/ANIMATE_PERSISTENCE.md` | Updated with full architecture documentation |

## Design Decisions

**Why localStorage over sessionStorage?**
`sessionStorage` dies when the tab closes. Users expected their animation setup to persist like any other app state. `localStorage` persists until explicitly cleared.

**Why save presets on animate AND Start Over?**
Both represent "I was done with this setup." Saving on animate captures successful configs for reuse. Saving on Start Over captures configs the user might want to return to later.

**Why max 10 presets?**
Balances utility with storage. Most users recall from their last 2-3 setups. 10 provides headroom without unbounded growth.

**Why show disabled controls on empty state?**
Industry best practice for tool discovery. Canva, Figma, and similar tools show the full control surface in a muted state before content is loaded. This communicates capabilities without requiring interaction, reducing bounce rate on the empty state.

**Why clear on sign out?**
Presets contain source image URLs and prompt text that are user-specific. Clearing prevents data leakage between accounts on shared devices.
