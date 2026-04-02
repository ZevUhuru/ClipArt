"use client";

import { useEffect, useState, useCallback } from "react";
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

type Tab = "mine" | "community";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (img: ImportableImage) => void;
}

export function ImageImportModal({ open, onClose, onSelect }: Props) {
  const { user } = useAppStore();
  const [tab, setTab] = useState<Tab>(user ? "mine" : "community");
  const [myImages, setMyImages] = useState<ImportableImage[]>([]);
  const [communityImages, setCommunityImages] = useState<ImportableImage[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [fetchedMine, setFetchedMine] = useState(false);
  const [fetchedCommunity, setFetchedCommunity] = useState(false);

  const fetchMine = useCallback(async () => {
    if (fetchedMine || loadingMine) return;
    setLoadingMine(true);
    try {
      const res = await fetch("/api/me/images");
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
      setFetchedMine(true);
    } catch {
      setMyImages([]);
    }
    setLoadingMine(false);
  }, [fetchedMine, loadingMine]);

  const fetchCommunity = useCallback(async () => {
    if (fetchedCommunity || loadingCommunity) return;
    setLoadingCommunity(true);
    try {
      const res = await fetch("/api/community");
      if (!res.ok) throw new Error("fetch failed");
      const { generations } = await res.json();
      setCommunityImages(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (generations || []).map((d: any) => ({
          id: d.id,
          url: d.image_url,
          title: d.prompt || d.title || "Untitled",
          slug: d.slug || d.id,
          category: d.category || "free",
          style: d.style || "flat",
          aspect_ratio: d.aspect_ratio,
        })),
      );
      setFetchedCommunity(true);
    } catch {
      setCommunityImages([]);
    }
    setLoadingCommunity(false);
  }, [fetchedCommunity, loadingCommunity]);

  useEffect(() => {
    if (!open) return;
    if (tab === "mine" && user) fetchMine();
    if (tab === "community") fetchCommunity();
  }, [open, tab, user, fetchMine, fetchCommunity]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const images = tab === "mine" ? myImages : communityImages;
  const loading = tab === "mine" ? loadingMine : loadingCommunity;
  const showSignIn = tab === "mine" && !user;

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
              className="pointer-events-auto flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Import Image</h2>
                <p className="text-xs text-gray-400">Choose an image to work with</p>
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

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100 px-5">
              {user && (
                <button
                  onClick={() => setTab("mine")}
                  className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tab === "mine" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  My Creations
                  {tab === "mine" && (
                    <motion.div
                      layoutId="import-tab"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-pink-500"
                    />
                  )}
                </button>
              )}
              <button
                onClick={() => setTab("community")}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tab === "community" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Community
                {tab === "community" && (
                  <motion.div
                    layoutId="import-tab"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-pink-500"
                  />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {showSignIn ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm text-gray-400">Sign in to see your creations</p>
                  <button
                    onClick={() => {
                      onClose();
                      useAppStore.getState().openAuthModal("signup");
                    }}
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    Sign In
                  </button>
                </div>
              ) : loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                </div>
              ) : images.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                    <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {tab === "mine" ? "No images yet" : "No community images yet"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tab === "mine" ? "Create some clip art first, then come back to import it." : "Be the first to create and share!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        onSelect(img);
                        onClose();
                      }}
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
                  ))}
                </div>
              )}
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
