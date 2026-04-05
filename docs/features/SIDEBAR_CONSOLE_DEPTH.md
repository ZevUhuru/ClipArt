# Sidebar Console Depth Effect

## Overview

Added visual depth separation between the sidebar and main content area, making the sidebar feel like an elevated "console" panel with the main content appearing as a recessed screen surface. Previously both areas sat on the same visual plane with only a 1px border dividing them.

## Design Rationale

The sidebar (`#1c1c27`) and main content (`bg-gray-100`) already had strong color contrast, but lacked physical depth cues — they read as two panels glued side by side. The goal was to introduce elevation hierarchy so the sidebar reads as a raised control panel and the content as an embedded display, creating a "console" aesthetic.

Three techniques combine to achieve this:

1. **Sidebar shadow** — A soft rightward shadow replaces the flat border, signaling the sidebar is elevated above the content surface.
2. **Rounded content edge** — A `rounded-l-2xl` on the main content's left edge creates a visual break that the brain reads as a separate recessed surface.
3. **Unified dark surround** — The layout wrapper matches the sidebar's dark color, so the rounded corner reveals a seamless dark surface behind the content, tying sidebar and surround into one physical panel.

## Implementation

### Files changed

| File | Change |
|------|--------|
| `app/(app)/layout.tsx` | Background changed from `bg-gray-100` to `bg-[#1c1c27]` (matches sidebar) |
| `src/components/AppSidebar.tsx` | `border-r border-white/[0.06]` replaced with `shadow-[4px_0_24px_rgba(0,0,0,0.3)]` |
| `src/components/AppMain.tsx` | Added `bg-gray-100 rounded-l-2xl overflow-hidden shadow-[inset_3px_0_12px_rgba(0,0,0,0.06)]` |

### Depth model

```
┌──────────────────────────────────────────────┐
│  Layout wrapper (bg-[#1c1c27])               │
│  ┌──────────┐  ┌────────────────────────────┐│
│  │          │  │╭                           ││
│  │ Sidebar  │──│  Main Content              ││
│  │ elevated │  │  bg-gray-100               ││
│  │ shadow→  │  │  rounded-l-2xl             ││
│  │          │  │  inset shadow              ││
│  │          │  │╰                           ││
│  └──────────┘  └────────────────────────────┘│
└──────────────────────────────────────────────┘
```

- **Sidebar**: `z-30`, `shadow-[4px_0_24px_rgba(0,0,0,0.3)]` — elevated, casts shadow rightward
- **Main content**: `rounded-l-2xl`, `shadow-[inset_3px_0_12px_rgba(0,0,0,0.06)]` — recessed, subtle inner shadow on left edge
- **Layout surround**: `bg-[#1c1c27]` — dark surface visible behind rounded corner, unifying sidebar and frame

### Mobile behavior

No changes to mobile layout. The sidebar is hidden on mobile (`hidden md:flex`) and the bottom nav is used instead. The rounded corners and shadows only apply on desktop viewports via the existing responsive classes.
