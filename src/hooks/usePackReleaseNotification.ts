"use client";

import { useCallback, useEffect, useState } from "react";

const PACK_RELEASE_ID = "orion-foxwell-character-packs";
const PACK_RELEASE_STORAGE_KEY = `clipart:pack-release-seen:${PACK_RELEASE_ID}`;

export function usePackReleaseNotification() {
  const [showPackRelease, setShowPackRelease] = useState(false);

  useEffect(() => {
    setShowPackRelease(localStorage.getItem(PACK_RELEASE_STORAGE_KEY) !== "true");
  }, []);

  const dismissPackRelease = useCallback(() => {
    localStorage.setItem(PACK_RELEASE_STORAGE_KEY, "true");
    setShowPackRelease(false);
  }, []);

  return { showPackRelease, dismissPackRelease };
}

