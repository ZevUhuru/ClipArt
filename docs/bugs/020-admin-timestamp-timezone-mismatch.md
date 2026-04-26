# Bug 020 — Admin Timestamp Timezone Mismatch

**Reported:** 2026-04-25  
**Status:** Fixed  
**Affected page:** `/admin/users/[id]`

## Symptom

On the admin user detail page, the "Signed up" and "Last seen" stats showed a
date one day ahead of what was visible on the image cards and modal directly
below them on the same screen.

Example: a user who signed up and generated an image at **9:16 PM EDT on
4/25/2026** was displayed as:

| Field | Shown | Why |
|---|---|---|
| Signed up | 4/26/2026, 1:14 AM | UTC (server-rendered) |
| Last seen | 4/26/2026, 1:17 AM | UTC (server-rendered) |
| Image created (card) | 4/25/2026 | Local browser time (client-rendered) |
| Image created (modal) | 4/25/2026, 9:16 PM | Local browser time (client-rendered) |

The dates were technically correct in absolute terms — all four timestamps
refer to the same real moment. But they were rendered in different timezone
contexts, making them appear contradictory.

## Root Cause

`app/admin/users/[id]/page.tsx` is a **Next.js server component**. The
`formatDate` helper called `new Date(ts).toLocaleString()` with no timezone
argument. On the server, `toLocaleString()` uses the server process's system
locale/timezone, which is **UTC**.

The image grid and modal are `"use client"` components. Their
`toLocaleString()` / `toLocaleDateString()` calls run in the **browser**, so
they use the admin's local timezone (EDT / America/New_York in this case).

Same ISO string, two different rendering environments → two different dates.

## Fix

Created `src/components/admin/LocalTime.tsx` — a thin `"use client"` wrapper
component:

```tsx
<time dateTime={ts} title={`UTC: ${new Date(ts).toUTCString()}`}>
  {new Date(ts).toLocaleString(undefined, { … })}
</time>
```

- Renders in the **browser's local timezone** — automatically correct for
  whoever is logged into the admin, regardless of where they are.
- Passes the raw ISO string from the DB; never formats on the server.
- Adds a `title` attribute with the UTC value for reference (visible on hover).

Updated `app/admin/users/[id]/page.tsx` to use `<LocalTime>` for "Signed up"
and "Last seen", removing the server-side `formatDate` helper entirely.

## General Rule

**Never call `toLocaleString()` / `toLocaleDateString()` inside a server
component.** Server components run in UTC. Pass the raw ISO timestamp to a
client component (`<LocalTime>`) and let the browser format it. This
guarantees all timestamps in the admin UI are in the same timezone context
— the admin's local time.
