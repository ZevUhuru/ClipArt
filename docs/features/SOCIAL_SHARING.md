# Social Sharing Feature

**Status**: Implemented (YouTube), extensible to Instagram/TikTok
**Date**: April 4, 2026

## Overview

Users can share their clip art animations directly to social platforms from within clip.art. The system is built with a multi-platform provider architecture — YouTube is the first integration, with Instagram and TikTok designed to slot in by adding a single provider file.

## Architecture

### Provider Framework (`src/lib/social/`)

```
src/lib/social/
  types.ts                    — SocialProvider interface, shared types
  registry.ts                 — Provider map, lookup helpers
  providers/
    youtube.ts                — YouTube OAuth + Data API v3 upload
    (instagram.ts)            — Future
    (tiktok.ts)               — Future
```

Each provider implements the `SocialProvider` interface:
- `getAuthUrl()` — Builds OAuth redirect URL with platform-specific scopes
- `exchangeCode()` — Exchanges auth code for tokens + account info
- `refreshAccessToken()` — Refreshes expired tokens
- `upload()` — Fetches video from R2, uploads to platform
- `revokeToken()` — Revokes access on disconnect
- `metadataConstraints` — Platform-specific limits (title length, tags, privacy options)

### Database Tables

**`social_connections`** — One row per user per platform:
- Stores OAuth tokens (access + refresh), account ID/name
- Unique constraint on `(user_id, provider)`
- RLS: users can read own; service role manages all

**`social_uploads`** — Every upload attempt:
- Links to animation, tracks platform video ID/URL, status
- Status: `uploading` → `published` | `failed`

Migration: `db/add-social-sharing.sql`

### API Routes (`/api/social/[provider]/`)

All routes are dynamic on `[provider]` and look up the provider from the registry:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/social/[provider]/connect` | Initiates OAuth flow with CSRF state cookie |
| GET | `/api/social/[provider]/callback` | Exchanges code, stores tokens, redirects back |
| GET | `/api/social/[provider]/status` | Returns connection status for current user |
| DELETE | `/api/social/[provider]/disconnect` | Revokes token, deletes connection |
| POST | `/api/social/[provider]/upload` | Uploads animation to platform |

Supporting routes:
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/me/social/connections` | Lists all connected platforms for user |
| GET | `/api/me/social/uploads` | Upload history with animation details |

### Upload Flow

1. Server validates user owns the animation and has a valid connection
2. If token is expired, auto-refreshes using refresh token
3. Creates `social_uploads` row with status `uploading`
4. Fetches video from R2, streams to platform API
5. Updates row to `published` with platform video ID/URL, or `failed` with error

## UI Components

### ShareModal (`src/components/ShareModal.tsx`)

Full-featured modal with:
- **Platform picker** — Shows available providers with connection status
- **Connect flow** — Redirects to OAuth if not connected
- **Metadata form** — Pre-filled from template, respects per-platform constraints:
  - Title: `{title} — Clip Art Animation` (with character counter)
  - Description: prompt + clip.art attribution
  - Tags: category + generic clip art tags (add/remove chips)
  - Privacy: Public / Unlisted / Private (platform-dependent)
- **Upload progress** — Spinner during upload, success state with link

### Integration Points

The Share button appears in two places:
- **Image Detail Drawer** — Below "Download Animation" for animation cards
- **Animate Page** — In the "Animation complete" action area

### Shared Tab in My Creations

A "Shared" tab in `/my-art` shows upload history:
- Each row shows thumbnail, title, platform badge, date, status
- Published uploads link to the platform video
- Empty state prompts user to share their first animation

### Connected Accounts in Nav

The mobile menu shows connected social accounts with disconnect buttons. Loads on menu open, shows platform icon + account name.

## YouTube-Specific Details

- **OAuth scope**: `https://www.googleapis.com/auth/youtube.upload`
- **Upload method**: YouTube Data API v3 `videos.insert` with video buffer
- **Category**: "People & Blogs" (categoryId: 22)
- **Made for Kids**: `false` (content targets adult creators, not children)
- **Quota**: Default 10,000 units/day, each upload costs 1,600 (~6/day). Apply for quota increase via Google Cloud Console if needed.

## Setup (Required before use)

1. In Google Cloud Console, create OAuth 2.0 credentials
2. Add authorized redirect URI: `https://clip.art/api/social/youtube/callback`
3. Enable YouTube Data API v3
4. Set environment variables:
   ```
   YOUTUBE_CLIENT_ID=your-client-id
   YOUTUBE_CLIENT_SECRET=your-client-secret
   ```
5. Run `db/add-social-sharing.sql` in Supabase SQL Editor

## Adding a New Platform

1. Create `src/lib/social/providers/{platform}.ts` implementing `SocialProvider`
2. Add to registry in `src/lib/social/registry.ts`
3. Add provider CHECK constraint value in `db/add-social-sharing.sql`
4. Add env vars for OAuth credentials
5. Add icon to `public/icons/{platform}.svg`
6. Add to `PROVIDERS_META` in `ShareModal.tsx`
7. It automatically appears in the Share modal and Connected Accounts

## Files Created

| File | Purpose |
|------|---------|
| `db/add-social-sharing.sql` | DB migration |
| `src/lib/social/types.ts` | Provider interface |
| `src/lib/social/registry.ts` | Provider registry |
| `src/lib/social/providers/youtube.ts` | YouTube implementation |
| `app/api/social/[provider]/connect/route.ts` | OAuth initiation |
| `app/api/social/[provider]/callback/route.ts` | OAuth callback |
| `app/api/social/[provider]/status/route.ts` | Connection status |
| `app/api/social/[provider]/disconnect/route.ts` | Disconnect |
| `app/api/social/[provider]/upload/route.ts` | Platform upload |
| `app/api/me/social/uploads/route.ts` | Upload history |
| `app/api/me/social/connections/route.ts` | Connection list |
| `src/components/ShareModal.tsx` | Share UI modal |
| `public/icons/youtube.svg` | YouTube icon |

## Files Modified

| File | Change |
|------|--------|
| `src/components/ImageDetailDrawer.tsx` | Added Share button for animations |
| `app/(app)/animate/page.tsx` | Added Share button in completion area |
| `app/(app)/my-art/page.tsx` | Added "Shared" tab with upload history |
| `src/components/Nav.tsx` | Added Connected Accounts to mobile menu |
| `.env.local` | Added `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` placeholders |
| `package.json` | Added `googleapis` dependency |
