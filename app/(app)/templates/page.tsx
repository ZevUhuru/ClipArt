"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";

interface SourceImage {
  id: string;
  image_url: string;
  title: string;
  slug: string;
  category: string;
}

interface PromptEntry {
  id: string;
  title: string;
  prompt: string;
  use_count: number;
  is_ai_generated: boolean;
  created_at: string;
  source: SourceImage | null;
}

type SortMode = "popular" | "recent";

export default function TemplatesPage() {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("popular");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pinToolbar, setPinToolbar] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const LIMIT = 30;

  const fetchPrompts = useCallback(async (sortMode: SortMode, page: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortMode,
        offset: String(page),
        limit: String(LIMIT),
      });
      if (q) params.set("q", q);
      const res = await fetch(`/api/prompts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts || []);
        setTotal(data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrompts(sort, offset, search);
  }, [sort, offset, search, fetchPrompts]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPinToolbar(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSort = (mode: SortMode) => {
    setSort(mode);
    setOffset(0);
    setExpandedId(null);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setOffset(0);
    setExpandedId(null);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasNext = offset + LIMIT < total;
  const hasPrev = offset > 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-white to-orange-50/60" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 sm:pb-10 sm:pt-14">
          <div className="flex flex-col items-center text-center">
            {total > 0 && (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-pink-200/60 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-600 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                {total} templates
              </span>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Prompt{" "}
              <span className="gradient-text">Templates</span>
            </h1>

            <p className="mt-3 max-w-lg text-balance text-sm text-gray-500 sm:text-base">
              Ready-to-use prompts crafted for stunning results.
              Copy, customize, and create.
            </p>

            <div className="mt-6 w-full max-w-xl">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search templates..."
                placeholders={[
                  "Search prompt templates...",
                  "Try \u201Cwalk cycle\u201D...",
                  "Try \u201Cbounce\u201D...",
                  "Try \u201Cexplosion\u201D...",
                ]}
                isLoading={loading}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/create"
                className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-gray-800"
              >
                Start Creating
              </Link>
              <Link
                href="/animate"
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                Animation Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky search bar (appears when hero scrolls away) */}
      {pinToolbar && (
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-xl">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search templates..."
              isLoading={loading}
              defaultValue={search}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {(["popular", "recent"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleSort(mode)}
                className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
                  sort === mode
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {mode === "popular" ? "Most Used" : "Newest"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {total} template{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Loading shimmer */}
        {loading && prompts.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <div className="mb-1.5 h-3.5 w-20 rounded bg-gray-100" />
                    <div className="h-3 w-28 rounded bg-gray-50" />
                  </div>
                </div>
                <div className="mb-2 h-4 w-24 rounded bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded bg-gray-50" />
                  <div className="h-3 w-5/6 rounded bg-gray-50" />
                  <div className="h-3 w-3/4 rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50">
              <svg className="h-8 w-8 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">No templates yet</h2>
            <p className="mt-1 max-w-xs text-sm text-gray-400">
              Templates appear here when you or other users generate AI suggestions in the Animation Studio.
            </p>
            <Link
              href="/animate"
              className="mt-4 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              Go to Animation Studio
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {prompts.map((p) => {
                  const isExpanded = expandedId === p.id;
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className={`group cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${
                        isExpanded ? "border-pink-200 ring-1 ring-pink-100 shadow-md" : "border-gray-100"
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      {/* Source image + meta */}
                      <div className="mb-3 flex items-center gap-3">
                        {p.source?.image_url ? (
                          <Link
                            href={`/animate?id=${p.source.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50 transition-transform hover:scale-105"
                          >
                            <Image
                              src={p.source.image_url}
                              alt={p.source.title || "Source"}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          </Link>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                            <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-gray-500">
                            {p.source?.title || "Unknown image"}
                          </p>
                          <div className="flex items-center gap-2">
                            {p.is_ai_generated && (
                              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-purple-500">
                                AI
                              </span>
                            )}
                            {p.use_count > 0 && (
                              <span className="text-[10px] tabular-nums text-gray-400">
                                used {p.use_count}x
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prompt title */}
                      <h3 className="mb-1.5 text-sm font-bold text-gray-800">
                        {p.title}
                      </h3>

                      {/* Prompt text */}
                      <p className={`text-[11px] leading-relaxed text-gray-400 ${
                        isExpanded ? "" : "line-clamp-3"
                      }`}>
                        {p.prompt}
                      </p>

                      {/* Actions (visible on expanded or hover) */}
                      <div className={`mt-3 flex items-center gap-2 ${isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(p.id, p.prompt); }}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                            copiedId === p.id
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {copiedId === p.id ? "Copied!" : "Copy"}
                        </button>
                        {p.source && (
                          <Link
                            href={`/animate?id=${p.source.id}&prompt=${encodeURIComponent(p.prompt)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg bg-pink-50 px-3 py-1.5 text-[11px] font-semibold text-pink-600 transition-all hover:bg-pink-100"
                          >
                            Use in Studio
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {(hasPrev || hasNext) && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={!hasPrev}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-xs tabular-nums text-gray-400">
                  {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                </span>
                <button
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={!hasNext}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
