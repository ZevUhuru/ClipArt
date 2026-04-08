"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

export interface ImportableImage {
  id: string;
  url: string;
  title: string;
  slug: string;
  category: string;
  style: string;
  aspect_ratio?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (img: ImportableImage) => void;
}

type ContentType = "all" | "clipart" | "coloring" | "illustration";

const CONTENT_CHIPS: { value: ContentType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "clipart", label: "Clip Art" },
  { value: "coloring", label: "Coloring" },
  { value: "illustration", label: "Illustrations" },
];

const PAGE_SIZE = 40;
const MY_ART_LIMIT = 12;

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function ImageImportModal({ open, onClose, onSelect }: Props) {
  const { user } = useAppStore();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [contentType, setContentType] = useState<ContentType>("all");
  const [expandMine, setExpandMine] = useState(false);

  const [myImages, setMyImages] = useState<ImportableImage[]>([]);
  const [communityImages, setCommunityImages] = useState<ImportableImage[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityOffset, setCommunityOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [communityTotal, setCommunityTotal] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  const isSearching = debouncedQuery.length > 0;

  // --- Fetch user's art ---
  const fetchMyArt = useCallback(
    async (searchQuery: string) => {
      if (!user) return;
      setLoadingMine(true);
      try {
        const limit = searchQuery ? PAGE_SIZE : MY_ART_LIMIT;
        const params = new URLSearchParams({ limit: String(limit) });
        if (searchQuery) params.set("q", searchQuery);
        const res = await fetch(`/api/me/images?${params}`);
        if (!res.ok) throw new Error("fetch failed");
        const { images } = await res.json();
        setMyImages(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (images || []).map((d: any) => ({
            id: d.id,
            url: d.image_url,
            title: d.title || d.prompt || "Untitled",
            slug: d.slug || d.id,
            category: d.category || "free",
            style: d.style || "flat",
            aspect_ratio: d.aspect_ratio,
          })),
        );
      } catch {
        setMyImages([]);
      }
      setLoadingMine(false);
    },
    [user],
  );

  // --- Fetch community art ---
  const fetchCommunity = useCallback(
    async (searchQuery: string, type: ContentType, offset: number, append: boolean) => {
      const id = ++fetchIdRef.current;
      if (!append) setLoadingCommunity(true);
      try {
        const params = new URLSearchParams({
          browse: "1",
          limit: String(PAGE_SIZE),
          offset: String(offset),
          content_type: type,
        });
        if (searchQuery) params.set("q", searchQuery);
        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error("fetch failed");
        if (id !== fetchIdRef.current) return;
        const { results, total } = await res.json();
        const mapped: ImportableImage[] = (results || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (d: any) => ({
            id: d.id,
            url: d.url || d.image_url,
            title: d.title || d.description || "Untitled",
            slug: d.slug || d.id,
            category: d.category || "free",
            style: d.style || "flat",
            aspect_ratio: d.aspect_ratio,
          }),
        );
        if (append) {
          setCommunityImages((prev) => [...prev, ...mapped]);
        } else {
          setCommunityImages(mapped);
        }
        setCommunityTotal(total ?? 0);
        setHasMore(offset + mapped.length < (total ?? 0));
      } catch {
        if (!append) setCommunityImages([]);
        setHasMore(false);
      }
      if (id === fetchIdRef.current) setLoadingCommunity(false);
    },
    [],
  );

  // --- Reset & fetch when modal opens or search/filter changes ---
  useEffect(() => {
    if (!open) return;
    setCommunityOffset(0);
    fetchMyArt(debouncedQuery);
    fetchCommunity(debouncedQuery, contentType, 0, false);
  }, [open, debouncedQuery, contentType, fetchMyArt, fetchCommunity]);

  // --- Reset state on close ---
  useEffect(() => {
    if (!open) {
      setQuery("");
      setContentType("all");
      setExpandMine(false);
      setCommunityImages([]);
      setMyImages([]);
      setCommunityOffset(0);
      setHasMore(true);
    }
  }, [open]);

  // --- Infinite scroll ---
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingCommunity) {
          const nextOffset = communityOffset + PAGE_SIZE;
          setCommunityOffset(nextOffset);
          fetchCommunity(debouncedQuery, contentType, nextOffset, true);
        }
      },
      { root: scrollRef.current, rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [open, hasMore, loadingCommunity, communityOffset, debouncedQuery, contentType, fetchCommunity]);

  // --- Escape key ---
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleSelect = (img: ImportableImage) => {
    onSelect(img);
    onClose();
  };

  const showMyArt = !!user;
  const myArtExpanded = expandMine || isSearching;
  const visibleMyImages = myArtExpanded ? myImages : myImages.slice(0, MY_ART_LIMIT);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <div
            className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="pointer-events-auto flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Import Art</h2>
                  <p className="text-xs text-gray-400">Choose art to work with</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search bar */}
              <div className="border-b border-gray-100 px-5 py-3">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search art..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {/* Your Art section */}
                {showMyArt && (
                  <div className="border-b border-gray-100 px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your Art</h3>
                      {!isSearching && myImages.length > 0 && (
                        <button
                          onClick={() => setExpandMine(!expandMine)}
                          className="text-xs font-medium text-pink-500 hover:text-pink-600"
                        >
                          {expandMine ? "Show less" : "See all"}
                        </button>
                      )}
                    </div>

                    {loadingMine ? (
                      <div className="flex h-20 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                      </div>
                    ) : myImages.length === 0 ? (
                      <p className="py-3 text-center text-xs text-gray-400">
                        {isSearching ? "No matching art found" : "No art yet — create some first!"}
                      </p>
                    ) : myArtExpanded ? (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {visibleMyImages.map((img) => (
                          <ImageCard key={img.id} img={img} onSelect={handleSelect} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {visibleMyImages.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => handleSelect(img)}
                            className="group relative flex-none overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
                          >
                            <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                              <Image
                                src={img.url}
                                alt={img.title}
                                fill
                                className="object-contain p-1.5 transition-transform group-hover:scale-105"
                                sizes="96px"
                                unoptimized
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Community Art section */}
                <div className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Community Art</h3>

                  {/* Content type chips */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {CONTENT_CHIPS.map((chip) => (
                      <button
                        key={chip.value}
                        onClick={() => setContentType(chip.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          contentType === chip.value
                            ? "bg-pink-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {loadingCommunity && communityImages.length === 0 ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                    </div>
                  ) : communityImages.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        {isSearching ? "No results found" : "No community art yet"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {communityImages.map((img) => (
                          <ImageCard key={img.id} img={img} onSelect={handleSelect} />
                        ))}
                      </div>

                      {/* Loading indicator for infinite scroll */}
                      {loadingCommunity && (
                        <div className="flex justify-center py-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                        </div>
                      )}

                      {/* Result count */}
                      {!loadingCommunity && communityTotal > 0 && (
                        <p className="py-3 text-center text-xs text-gray-400">
                          Showing {communityImages.length} of {communityTotal}
                        </p>
                      )}
                    </>
                  )}

                  {/* Sentinel for infinite scroll */}
                  <div ref={sentinelRef} className="h-1" />
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}

function ImageCard({
  img,
  onSelect,
}: {
  img: ImportableImage;
  onSelect: (img: ImportableImage) => void;
}) {
  return (
    <button
      onClick={() => onSelect(img)}
      className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
    >
      <div className="relative aspect-square">
        <Image
          src={img.url}
          alt={img.title}
          fill
          className="object-contain p-2 transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, 25vw"
          unoptimized
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-[10px] font-medium text-white">{img.title}</p>
      </div>
    </button>
  );
}
