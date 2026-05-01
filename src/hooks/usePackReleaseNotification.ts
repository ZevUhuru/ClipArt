"use client";

import { useCallback, useEffect, useState } from "react";

export interface ActivePackRelease {
  id: string;
  release_key: string;
  title: string;
  badge_label: string;
  description: string | null;
  target_path: string;
  pack_id: string | null;
}

export function packReleaseLandingPath(release: ActivePackRelease) {
  return `/packs?drop=${encodeURIComponent(release.release_key)}`;
}

export function usePackReleaseNotification() {
  const [release, setRelease] = useState<ActivePackRelease | null>(null);
  const [showPackRelease, setShowPackRelease] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/packs/releases/active", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const activeRelease = (data.release || null) as ActivePackRelease | null;
        setRelease(activeRelease);
        if (!activeRelease) {
          setShowPackRelease(false);
          return;
        }

        const storageKey = `clipart:pack-release-seen:${activeRelease.release_key}`;
        setShowPackRelease(localStorage.getItem(storageKey) !== "true");
      })
      .catch(() => {
        if (!cancelled) setShowPackRelease(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissPackRelease = useCallback(() => {
    if (release) {
      localStorage.setItem(`clipart:pack-release-seen:${release.release_key}`, "true");
    }
    setShowPackRelease(false);
  }, [release]);

  return { release, showPackRelease, dismissPackRelease };
}

