"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface AnimationData {
  id: string;
  title: string;
  prompt: string;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  iconPath: string;
  connected: boolean;
  accountName?: string;
  constraints: {
    maxTitleLength: number;
    maxDescriptionLength: number;
    maxTags: number;
    supportsPrivacy: boolean;
    privacyOptions: string[];
    defaultPrivacy: string;
  };
}

type UploadState = "idle" | "uploading" | "success" | "error";

const PROVIDERS_META: Record<
  string,
  { name: string; iconPath: string; color: string }
> = {
  youtube: {
    name: "YouTube",
    iconPath: "/icons/youtube.svg",
    color: "text-red-600",
  },
};

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  if (provider === "youtube") return <YouTubeIcon className={className} />;
  return null;
}

export function ShareModal({
  animation,
  onClose,
}: {
  animation: AnimationData;
  onClose: () => void;
}) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState("unlisted");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/me/social/connections");
      const data = await res.json();
      const connections: { provider: string; account_name: string }[] =
        data.connections || [];

      const providerList: ProviderInfo[] = Object.entries(PROVIDERS_META).map(
        ([id, meta]) => {
          const conn = connections.find((c) => c.provider === id);
          return {
            id,
            name: meta.name,
            iconPath: meta.iconPath,
            connected: !!conn,
            accountName: conn?.account_name || undefined,
            constraints: getConstraints(id),
          };
        },
      );

      setProviders(providerList);

      const connected = providerList.find((p) => p.connected);
      if (connected && !selectedProvider) {
        setSelectedProvider(connected.id);
        applyTemplate(connected.id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function getConstraints(providerId: string) {
    if (providerId === "youtube") {
      return {
        maxTitleLength: 100,
        maxDescriptionLength: 5000,
        maxTags: 30,
        supportsPrivacy: true,
        privacyOptions: ["public", "unlisted", "private"],
        defaultPrivacy: "unlisted",
      };
    }
    return {
      maxTitleLength: 100,
      maxDescriptionLength: 2000,
      maxTags: 20,
      supportsPrivacy: false,
      privacyOptions: [],
      defaultPrivacy: "public",
    };
  }

  function applyTemplate(providerId: string) {
    const c = getConstraints(providerId);
    setTitle(
      `${animation.title} — Clip Art Animation`.slice(0, c.maxTitleLength),
    );
    setDescription(
      `${animation.prompt}\n\nGenerated with AI at clip.art — Create your own free clip art and animations at https://clip.art`.slice(
        0,
        c.maxDescriptionLength,
      ),
    );
    setTags(
      [
        animation.category,
        "clip art",
        "animation",
        "ai generated",
        "free clip art",
      ].filter(Boolean),
    );
    setPrivacy(c.defaultPrivacy);
  }

  function handleSelectProvider(id: string) {
    const p = providers.find((pr) => pr.id === id);
    if (!p) return;

    if (!p.connected) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.href = `/api/social/${id}/connect?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }

    setSelectedProvider(id);
    applyTemplate(id);
    setUploadState("idle");
    setResultUrl(null);
    setErrorMsg(null);
  }

  function handleAddTag(e: React.KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const tag = tagInput.trim().replace(/,/g, "");
    if (!tag || tags.includes(tag)) {
      setTagInput("");
      return;
    }
    const constraint = selectedProvider
      ? getConstraints(selectedProvider)
      : null;
    if (constraint && tags.length >= constraint.maxTags) return;
    setTags([...tags, tag]);
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleUpload() {
    if (!selectedProvider || uploadState === "uploading") return;

    setUploadState("uploading");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/social/${selectedProvider}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animationId: animation.id,
          title,
          description,
          tags,
          privacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadState("success");
      setResultUrl(data.platformUrl);
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const selectedProviderData = providers.find(
    (p) => p.id === selectedProvider,
  );
  const constraints = selectedProvider
    ? getConstraints(selectedProvider)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Share Animation
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
            </div>
          ) : (
            <>
              {/* Platform picker */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Platform
                </label>
                <div className="flex gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProvider(p.id)}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        selectedProvider === p.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : p.connected
                            ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            : "border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      <ProviderIcon
                        provider={p.id}
                        className={`h-4 w-4 ${selectedProvider === p.id ? "text-white" : PROVIDERS_META[p.id]?.color || ""}`}
                      />
                      {p.name}
                      {p.connected && (
                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!p.connected && (
                        <span className="text-xs text-gray-400">
                          Connect
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedProviderData?.accountName && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Posting to{" "}
                    <span className="font-medium text-gray-600">
                      {selectedProviderData.accountName}
                    </span>
                  </p>
                )}
              </div>

              <AnimatePresence mode="wait">
                {uploadState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Uploaded successfully!
                    </p>
                    {resultUrl && (
                      <a
                        href={resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        View on{" "}
                        {selectedProviderData?.name || "platform"}
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </motion.div>
                ) : selectedProvider && selectedProviderData?.connected ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Preview */}
                    <div className="mb-4 flex gap-3 rounded-xl bg-gray-50 p-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                        {animation.thumbnailUrl && (
                          <Image
                            src={animation.thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {animation.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {animation.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Title
                        </label>
                        {constraints && (
                          <span
                            className={`text-xs ${title.length > constraints.maxTitleLength ? "text-red-500" : "text-gray-300"}`}
                          >
                            {title.length}/{constraints.maxTitleLength}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300"
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Description
                        </label>
                        {constraints && (
                          <span
                            className={`text-xs ${description.length > constraints.maxDescriptionLength ? "text-red-500" : "text-gray-300"}`}
                          >
                            {description.length}/
                            {constraints.maxDescriptionLength}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300"
                      />
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 px-2 py-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Add tag..."
                          className="min-w-[80px] flex-1 border-none bg-transparent px-1 py-0.5 text-xs text-gray-700 outline-none placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    {/* Privacy */}
                    {constraints?.supportsPrivacy && (
                      <div className="mb-5">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Privacy
                        </label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300"
                        >
                          {constraints.privacyOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Error */}
                    {uploadState === "error" && errorMsg && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {errorMsg}
                      </div>
                    )}

                    {/* Upload button */}
                    <button
                      onClick={handleUpload}
                      disabled={
                        uploadState === "uploading" ||
                        !title.trim() ||
                        (constraints
                          ? title.length > constraints.maxTitleLength
                          : false)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadState === "uploading" ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Uploading to{" "}
                          {selectedProviderData?.name}...
                        </>
                      ) : (
                        <>
                          <ProviderIcon
                            provider={selectedProvider}
                            className="h-4 w-4"
                          />
                          Upload to{" "}
                          {selectedProviderData?.name}
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : !selectedProvider ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-sm text-gray-400">
                      Select a platform above to get started
                    </p>
                  </div>
                ) : null}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
