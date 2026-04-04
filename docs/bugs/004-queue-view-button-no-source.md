# BUG-004: Queue "View" Button Does Nothing When No Source Image Is Loaded

**Status**: Resolved
**Severity**: Medium (completed animations can't be previewed without workaround)
**Affected Page**: `/animate`
**Date Reported**: April 3, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. User navigates to `/animate` without a `?id=` parameter (no source image loaded)
2. The Animation Queue shows completed jobs from the persistent queue (previous session)
3. User clicks the "View" button on a completed animation
4. Nothing happens — no video plays, no scroll, no visual feedback

**Workaround**: User had to import the original source image first, then the View button would work. Or navigate to My Creations to view the animation there.

## Root Cause

The left-column canvas area had a two-branch conditional:

```typescript
{!source ? (
  // Empty state: "Import an image to animate" with Import button
) : activeVideoUrl && !showSource ? (
  // Video player
) : (
  // Source image
)}
```

When the user clicks "View" on a queue item, `handleViewResult` sets `viewingVideo` state to the video URL. This feeds into `activeVideoUrl`:

```typescript
const activeVideoUrl = viewingVideo || latestCompleted?.videoUrl || null;
```

But `activeVideoUrl` is only consumed in the second branch (`source` exists). When `source` is `null`, the first branch renders the empty state — the video player is never reached regardless of what `viewingVideo` contains.

### State Flow

```
Click "View" → setViewingVideo(url) → activeVideoUrl = url
                                           ↓
                              But render path is: !source → empty state
                              Video player branch never evaluated
```

## Fix

Added a new branch that takes priority when there's no source but a video is being viewed:

```typescript
{!source && viewingVideo ? (
  // Video player (no source needed)
) : !source ? (
  // Empty state
) : activeVideoUrl && !showSource ? (
  // Video player (with source)
) : (
  // Source image
)}
```

Additional changes:
- **Animation/Original toggle**: Now requires `source` to render (can't show "Original" tab when there's no source image)
- **Download button**: Uses `source?.slug || "clip-art"` for the filename instead of requiring `source`
- **Result actions section**: Renders with just `activeVideoUrl` instead of `activeVideoUrl && source`

### State Flow After Fix

```
Click "View" → setViewingVideo(url)
                    ↓
              !source && viewingVideo → Video player renders
              Download + My Creations actions visible
```

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/animate/page.tsx` | Added sourceless video branch, made download/actions graceful without source |

## Lessons

1. **Test persistent UI from a blank state** — the queue persists across sessions, so users can arrive at `/animate` with completed jobs but no source image. The "View" interaction needs to work from this state.
2. **Conditional rendering branches can create dead zones** — when a feature (video playback) is only reachable inside one branch of a conditional (`source` exists), any entry point that doesn't set that condition creates an invisible dead end.
3. **Map all state combinations** — the relevant state space was `{source: null|set} × {viewingVideo: null|set}`. The original code only handled `{set, set}` and `{null, null}` but missed `{null, set}`.
