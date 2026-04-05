"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface Platform {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  description: string;
  comingSoon?: boolean;
}

const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: "/icons/youtube.svg",
    available: true,
    description: "Upload animations directly to your YouTube channel",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "/icons/instagram.svg",
    available: false,
    description: "Share animations as Instagram Reels",
    comingSoon: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "/icons/tiktok.svg",
    available: false,
    description: "Post animations to TikTok",
    comingSoon: true,
  },
];

interface Connection {
  provider: string;
  account_id: string;
  account_name: string;
  created_at: string;
}

export function ConnectedAccounts() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/me/social/connections");
      if (!res.ok) return;
      const data = await res.json();
      setConnections(data.connections || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("social_connected")) {
      fetchConnections();
      const url = new URL(window.location.href);
      url.searchParams.delete("social_connected");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchConnections]);

  async function handleDisconnect(provider: string) {
    setDisconnecting(provider);
    try {
      await fetch(`/api/social/${provider}/disconnect`, { method: "DELETE" });
      setConnections((prev) => prev.filter((c) => c.provider !== provider));
    } catch { /* ignore */ }
    setDisconnecting(null);
  }

  function handleConnect(provider: string) {
    const returnTo = `/settings?social_connected=${provider}`;
    window.location.href = `/api/social/${provider}/connect?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-lg font-bold text-gray-900">Connected Accounts</h2>
        <p className="mt-1 text-sm text-gray-500">
          Link your social accounts to upload animations directly from clip.art.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {PLATFORMS.map((platform) => {
          const conn = connections.find((c) => c.provider === platform.id);
          const isConnected = !!conn;

          return (
            <div
              key={platform.id}
              className={`rounded-2xl border bg-white p-5 transition-all ${
                platform.comingSoon
                  ? "border-gray-100 opacity-60"
                  : isConnected
                    ? "border-green-100"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Platform icon */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isConnected ? "bg-green-50" : "bg-gray-50"
                }`}>
                  <Image
                    src={platform.icon}
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {platform.name}
                    </h3>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Connected
                      </span>
                    )}
                    {platform.comingSoon && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                        Coming soon
                      </span>
                    )}
                  </div>

                  {isConnected ? (
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {conn.account_name || conn.account_id}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-gray-400">
                      {platform.description}
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0 pt-0.5">
                  {loading ? (
                    <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
                  ) : platform.comingSoon ? (
                    <button
                      disabled
                      className="rounded-lg bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-300 cursor-not-allowed"
                    >
                      Connect
                    </button>
                  ) : isConnected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnecting === platform.id}
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      {disconnecting === platform.id ? "..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
