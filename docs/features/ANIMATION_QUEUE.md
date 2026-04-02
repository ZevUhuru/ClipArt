# Persistent Animation Queue

## Problem

Animation state previously lived in page-local `useState` on the `/animate` page. Navigating away destroyed it — the animation was still running server-side (Fal.ai row in the `animations` table with `status: 'processing'`), but the client had no way to reconnect. Users had to stay on the page and wait.

## Solution

A persistent animation queue backed by a Zustand store + DB reconnection. Animations survive:

- **Page navigation** — Zustand store lives in module scope, outlives any single page
- **Browser refresh** — on auth ready, pending animations are fetched from the DB and loaded into the store
- **Browser shutdown** — same DB reconnection on next login

The queue supports **multiple concurrent animations**. Users can submit a prompt, immediately write another, and queue it up — all while previous animations generate in the background.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Client                                             │
│                                                     │
│  Animate Page ──addJob()──▶ useAnimationQueue       │
│                             (Zustand store)         │
│                                  │                  │
│                          polls every 5s             │
│                                  ▼                  │
│                       /api/animate/status            │
│                                                     │
│  Providers.tsx ──on auth──▶ /api/me/animations/     │
│                             pending                  │
│                                  │                  │
│                          loadPending()              │
│                                  ▼                  │
│                         useAnimationQueue           │
│                                  │                  │
│                          renders                    │
│                                  ▼                  │
│                       AnimationQueue UI             │
└─────────────────────────────────────────────────────┘
```

## Files

| File | Role |
|------|------|
| `src/stores/useAnimationQueue.ts` | Zustand store — holds `QueuedAnimation[]`, manages polling, exposes `addJob`, `updateJob`, `removeJob`, `loadPending` |
| `app/api/me/animations/pending/route.ts` | Returns user's `processing` animations + recently completed/failed (last 30 min), joined with source generation for thumbnails |
| `src/components/AnimationQueue.tsx` | Queue card UI — progress bar, stage labels, elapsed time, view/dismiss actions |
| `app/(app)/animate/page.tsx` | Refactored to use queue store instead of local `isAnimating`/`animationId`/`videoUrl`/`pollRef` state |
| `src/components/Providers.tsx` | Loads pending animations from DB on auth ready (login, page refresh, browser restart) |

## Queue Store Interface

```typescript
interface QueuedAnimation {
  id: string;           // animations table row id
  sourceUrl: string;    // thumbnail for the queue card
  sourceTitle: string;
  prompt: string;
  model: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  startedAt: number;    // Date.now() for elapsed time display
}
```

## Progress Indicators

No spinners. The queue cards use:

- **Thin gradient progress bar** (pink-to-orange) with simulated percentage using an easing curve that accelerates through early stages and decelerates toward the end
- **Stage-based status messages**: "Queued" → "Generating frames" → "Rendering video" → "Almost done" → "Complete"
- **Elapsed time counter** in human-readable form ("1m 23s")
- **Percentage display** in tabular-nums for clean alignment

## Key Behaviors

1. **Submit and forget**: clicking "Animate" adds a job to the queue and clears the prompt field so the user can immediately write another prompt
2. **Multi-job support**: the queue holds all active jobs; no limit on concurrent animations
3. **Auto-polling**: a single `setInterval` polls `/api/animate/status` every 5 seconds for all processing jobs; auto-stops when none remain
4. **DB reconnection**: `Providers.tsx` calls `/api/me/animations/pending` whenever auth state is confirmed, loading any in-flight or recently finished animations into the store
5. **View result**: clicking "View" on a completed queue card loads the video into the canvas area
6. **Source-aware**: the animate page filters queue jobs to show only those for the currently loaded source image

## Pending API Query

```sql
-- Processing animations (still running)
SELECT a.*, g.image_url, g.title
FROM animations a
LEFT JOIN generations g ON g.id = a.source_generation_id
WHERE a.user_id = $1 AND a.status = 'processing'
ORDER BY a.created_at DESC
LIMIT 10

-- Recently finished (last 30 min)
SELECT a.*, g.image_url, g.title
FROM animations a
LEFT JOIN generations g ON g.id = a.source_generation_id
WHERE a.user_id = $1
  AND a.status IN ('completed', 'failed', 'refunded')
  AND a.completed_at >= now() - interval '30 minutes'
ORDER BY a.completed_at DESC
LIMIT 5
```
