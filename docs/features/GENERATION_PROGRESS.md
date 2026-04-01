# Generation Progress Loader

## Overview

A simulated progress bar with rotating status messages that replaces the infinite spinner during AI image generation. The component provides meaningful visual feedback across all three generation surfaces: homepage, clip art create, and coloring pages create.

## UX Research and Rationale

### Nielsen Norman Group: Response Time Thresholds

Jakob Nielsen's foundational research on response times (1993, updated 2014) establishes three critical thresholds:

- **0.1 seconds**: Feels instantaneous. No feedback needed.
- **1 second**: Users notice a delay but maintain flow. A simple indicator suffices.
- **10 seconds**: Users lose focus and may abandon the task. Progress feedback is essential to keep users engaged and prevent them from assuming the system is broken.

Our image generation takes **5-15 seconds** — firmly in the zone where meaningful progress feedback is required. An indeterminate spinner provides no information about how long the wait will be or whether the system is making progress.

*Source: Nielsen, J. (1993). Response Times: The 3 Important Limits. Updated in Nielsen, J. (2014). Response Times: The 3 Important Limits. Nielsen Norman Group.*

### Visibility of System Status (Heuristic #1)

Nielsen's first usability heuristic — **Visibility of System Status** — states that "the design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time." An indeterminate spinner violates this heuristic by providing no meaningful information about the system's state or progress.

Our implementation addresses this by:

1. Showing a **progress bar** that communicates forward motion
2. Displaying **phase-specific status messages** that describe what the system is doing
3. Including a **percentage counter** that gives a concrete sense of completion

*Source: Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group.*

### Progress Bars vs. Spinners: Perceived Duration

Harrison, Yeo, and Amer's research on progress bar behavior (2010) found that:

- **Progress bars reduce perceived wait time by approximately 36%** compared to indeterminate spinners for operations of similar actual duration
- **Decelerating progress bars** (fast start, slow finish) are perceived as faster than linear or accelerating ones — users form their duration estimate early when the bar is moving quickly, and the slower tail end doesn't significantly revise that estimate upward
- **Pulsating or animated progress indicators** feel faster than static ones

Our implementation uses a **decelerating curve** that reaches ~60% within 3 seconds, then progressively slows through 85%, 95%, and asymptotically approaches 99% — matching the optimal pattern identified in this research.

*Source: Harrison, C., Yeo, Z., & Hudson, S. E. (2010). Faster Progress Bars: Manipulating Perceived Duration with Visual Augmentations. Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '10).*

### Phased Status Messages

Research on wait-time psychology shows that providing contextual information about what is happening during a wait reduces anxiety and abandonment. Rotating status messages serve dual purposes:

1. **Cognitive engagement**: Reading new messages occupies the user's attention, making the wait feel shorter
2. **Process transparency**: Users understand the system is doing real work, not just spinning

## Implementation

### Component: `GenerationProgress`

**Location**: `src/components/GenerationProgress.tsx`

```tsx
<GenerationProgress isGenerating={isGenerating} variant="clipart" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isGenerating` | `boolean` | required | Controls visibility and progress simulation |
| `variant` | `"clipart" \| "coloring"` | `"clipart"` | Selects contextual status messages |

### Progress Simulation Curve

The `useSimulatedProgress` hook drives a four-phase deceleration curve via `requestAnimationFrame`:

| Phase | Range | Duration | Behavior |
|-------|-------|----------|----------|
| 1 | 0-60% | ~3 seconds | Fast ease-out ramp (power curve) |
| 2 | 60-85% | ~5 seconds | Linear moderate pace |
| 3 | 85-95% | ~7 seconds | Slow crawl |
| 4 | 95-99% | Indefinite | Exponential decay, asymptotically approaches 99% |
| Done | 100% | Instant | Snaps to 100% when API responds, then fades out |

### Status Messages

Messages rotate based on progress thresholds:

**Clip Art variant:**

| Threshold | Message |
|-----------|---------|
| 0% | "Analyzing your prompt..." |
| 15% | "Generating artwork..." |
| 50% | "Adding details..." |
| 80% | "Applying final touches..." |
| 95% | "Almost there..." |

**Coloring variant:**

| Threshold | Message |
|-----------|---------|
| 0% | "Analyzing your prompt..." |
| 15% | "Drawing outlines..." |
| 50% | "Refining line art..." |
| 80% | "Applying final touches..." |
| 95% | "Almost there..." |

### Integration Points

The component is used in three locations:

1. **Homepage Generator** (`src/components/Generator.tsx`) — rendered in the result area below the generate button
2. **Clip Art Create** (`app/(app)/create/page.tsx`) — rendered in the content area above error/grid sections
3. **Coloring Pages Create** (`app/(app)/create/coloring-pages/page.tsx`) — same as clip art, with `variant="coloring"`

### Visual Design

- Rounded card with subtle border and backdrop blur
- Brand gradient icon (sparkle) with `animate-pulse-soft`
- Brand gradient progress bar with framer-motion width transitions
- Smooth entry/exit animations via `AnimatePresence`
- Percentage counter in tabular-nums for stable width

## Maintenance

### Adjusting Timing

Edit the phase boundaries in `useSimulatedProgress` within `GenerationProgress.tsx`. The key constants are the elapsed-time thresholds in the `tick` function (currently 3s, 8s, 15s).

### Adding Variants

1. Add a new message array (e.g., `const LOGO_MESSAGES = [...]`)
2. Extend the `variant` prop type
3. Add the variant to the message selection logic

### Changing Messages

Edit the `CLIPART_MESSAGES` or `COLORING_MESSAGES` arrays and their corresponding `MESSAGE_THRESHOLDS` array at the top of the component file.
