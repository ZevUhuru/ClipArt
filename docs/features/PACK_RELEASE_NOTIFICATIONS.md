# Pack Release Notifications

## Goal

Pack release notifications announce a newly released pack to all users through the app navigation. The first use case is the Orion Foxwell character pack drop, but the system is designed for any future pack release.

The notification should feel like a product drop, not a quiet status dot:

- Mobile bottom nav shows a `New drop` callout above the Packs gift icon.
- Desktop sidebar shows a visible `New drop` badge and glow on the Packs icon.
- Collapsed desktop sidebar shows a hover callout with the release title.
- Clicking the Packs icon dismisses the notification for that user/browser.

## User Behavior

All users can see the active release notification until they click the Packs icon.

Dismissal is local to the browser and keyed by `release_key`:

```text
clipart:pack-release-seen:{release_key}
```

This means a user who dismissed the Orion release can still see the next release because the next release has a different key.

## Admin Behavior

Admins manage release notifications from `/admin/packs`.

The admin panel supports:

- Viewing the active/recent pack release notifications.
- Manually launching a notification for any published pack.
- Activating or deactivating recent releases.
- Enabling `Auto-launch notification when publishing`, which creates a release when a pack is published from the admin table.

Only one release should be active at a time. Activating a new release deactivates the previous active release.

## Data Model

Migration:

`db/add-pack-release-notifications.sql`

Table:

`pack_release_notifications`

Important fields:

- `release_key` - stable dismissal key for users.
- `pack_id` - optional link to the pack being announced.
- `title` - release title, shown in hover/callout contexts.
- `badge_label` - short badge copy, usually `New drop`.
- `description` - admin/context copy.
- `target_path` - route users land on when clicking Packs while the release is active.
- `launch_mode` - `manual` or `auto`.
- `is_active` - whether this release is currently live.
- `starts_at` / `ends_at` - scheduling window.

## API

Public endpoint:

- `GET /api/packs/releases/active`

Returns the latest active release whose `starts_at` / `ends_at` window is valid.

Admin endpoint:

- `GET /api/admin/packs/releases` - list recent releases.
- `POST /api/admin/packs/releases` - create and optionally activate a release.
- `PATCH /api/admin/packs/releases` - activate, deactivate, or update release fields.

Pack admin publish automation:

- `PATCH /api/admin/packs/[id]` accepts `auto_launch_release: true`.
- When a public pack is published with that flag, the API creates an active `launch_mode = auto` release.

## Implementation Notes

The client hook lives at:

`src/hooks/usePackReleaseNotification.ts`

It fetches the active release, checks local dismissal state by `release_key`, and exposes:

- `release`
- `showPackRelease`
- `dismissPackRelease`

The notification UI currently appears in:

- `src/components/AppBottomNav.tsx`
- `src/components/AppSidebar.tsx`

## Future Improvements

- Add scheduled release creation from Pack Studio publish flow.
- Add release analytics: impressions, clicks, dismissals.
- Add richer release types, such as featured character, seasonal drop, paid pack launch, or free pack announcement.
- Move from browser-only dismissal to account-level dismissal for signed-in users if repeat visibility across devices becomes annoying.

