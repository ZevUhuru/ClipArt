# Bug 019: Search Page — Category & Style Dropdowns Clipped

**Date**: 2026-04-08
**Status**: Fixed
**Severity**: Medium

## Symptom

On the `/search` page, clicking the "Category" or "Style" filter buttons did
nothing visible — the dropdown menus never appeared.

## Root Cause

The toolbar wrapper `<div>` containing the filter buttons had
`overflow-x-auto no-scrollbar` applied. Per the CSS spec, when one overflow
axis is set to anything other than `visible`, the browser forces the other axis
to `auto` as well. This created a scroll container that clipped the
absolutely-positioned `FilterPopover` dropdown menus extending below the
toolbar bounds.

## Fix

Removed `overflow-x-auto no-scrollbar` from the toolbar flex container. On
mobile viewports the existing `FilterDrawer` (toggled by a separate button with
`md:hidden`) already handles filter selection, so horizontal scrolling on the
toolbar was unnecessary.

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/search/page.tsx` | Removed `overflow-x-auto no-scrollbar` from toolbar wrapper |
