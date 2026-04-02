"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { GenerationProgress } from "@/components/GenerationProgress";
import { downloadClip } from "@/utils/downloadClip";

const EDIT_PRESETS = [
  { label: "Remove Background", instruction: "Remove the background completely, make it transparent, keep only the main subject" },
  { label: "White Background", instruction: "Set the background to pure white, keep the main subject unchanged" },
  { label: "Add Outline", instruction: "Add a thick bold outline around the main subject" },
  { label: "Make Coloring Page", instruction: "Convert this to a black and white coloring book page with thick clean outlines, no color, no shading" },
  { label: "Make Cuter", instruction: "Make this illustration cuter and more kawaii-style while keeping the same subject" },
];

interface SourceImage {
  id: string;
  url: string;
  title: string;
  slug: string;
  category: string;
  style: string;
  aspect_ratio?: string;
}

interface EditResult {
  imageUrl: string;
  generation: {
    id: string;
    image_url: string;
    slug: string;
    category: string;
    style: string;
    aspect_ratio?: string;
  };
}

function EditPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("id");

  const { user, openAuthModal, openBuyCreditsModal, setCredits, prependGeneration } = useAppStore();

  const [source, setSource] = useState<SourceImage | null>(null);
  const [sourceLoading, setSourceLoading] = useState(!!sourceId);
  const [instruction, setInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EditResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [showBefore, setShowBefore] = useState(false);

  useEffect(() => {
    if (!sourceId) return;

    async function loadSource() {
      setSourceLoading(true);
      const supabase = createBrowserClient();
      if (!supabase) return;

      const { data } = await supabase
        .from("generations")
        .select("id, image_url, title, slug, category, style, aspect_ratio")
        .eq("id", sourceId)
        .single();

      if (data) {
        setSource({
          id: data.id,
          url: data.image_url,
          title: data.title || "Untitled",
          slug: data.slug || data.id,
          category: data.category || "free",
          style: data.style || "flat",
          aspect_ratio: data.aspect_ratio,
        });
      }
      setSourceLoading(false);
    }

    loadSource();
  }, [sourceId]);

  const handleEdit = useCallback(async () => {
    if (!instruction.trim() || isEditing || !source) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setIsEditing(true);

    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: source.url,
          instruction: instruction.trim(),
          isPublic: true,
        }),
      });

      const data = await res.json();

      if (res.status === 401 && data.requiresAuth) {
        openAuthModal("signup");
        return;
      }
      if (res.status === 402 && data.requiresCredits) {
        openBuyCreditsModal();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Edit failed");

      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.generation) prependGeneration(data.generation);

      setResult(data);
      setShowBefore(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsEditing(false);
    }
  }, [instruction, isEditing, source, user, openAuthModal, openBuyCreditsModal, setCredits, prependGeneration]);

  const handleEditAgain = () => {
    if (!result) return;
    setSource({
      id: result.generation.id,
      url: result.generation.image_url,
      title: `Edited: ${instruction.slice(0, 40)}`,
      slug: result.generation.slug,
      category: result.generation.category,
      style: result.generation.style,
      aspect_ratio: result.generation.aspect_ratio,
    });
    setResult(null);
    setInstruction("");
  };

  const handlePresetClick = (preset: typeof EDIT_PRESETS[number]) => {
    setInstruction(preset.instruction);
  };

  if (sourceLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
      </div>
    );
  }

  if (!source && !sourceLoading) {
    return <ImagePicker onSelect={setSource} />;
  }

  const displayUrl = result && !showBefore ? result.imageUrl : source!.url;
  const aspectClass = source?.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Image</h1>
            <p className="text-xs text-gray-400">
              Editing: {source!.title}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Image preview */}
          <div>
            <div ref={resultRef} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className={`relative w-full ${aspectClass}`}>
                <Image
                  src={displayUrl}
                  alt={result ? "Edited image" : source!.title}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              </div>
            </div>

            {/* Before/After toggle */}
            {result && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowBefore(false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    !showBefore ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  After
                </button>
                <button
                  onClick={() => setShowBefore(true)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    showBefore ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Before
                </button>
              </div>
            )}
          </div>

          {/* Right: Edit controls */}
          <div className="space-y-5">
            {/* Instruction input */}
            <div>
              <label htmlFor="edit-instruction" className="mb-2 block text-sm font-semibold text-gray-700">
                What would you like to change?
              </label>
              <textarea
                id="edit-instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe your edit... (e.g. remove the background, change the color to blue)"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                rows={4}
                maxLength={1000}
                disabled={isEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleEdit();
                  }
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-300">
                <span>Cmd+Enter to submit</span>
                <span>{instruction.length}/1000</span>
              </div>
            </div>

            {/* Quick-action presets */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Quick edits
              </p>
              <div className="flex flex-wrap gap-2">
                {EDIT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    disabled={isEditing}
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Edit button */}
            <button
              onClick={handleEdit}
              disabled={!instruction.trim() || isEditing}
              className="w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? "Applying Edit…" : "Apply Edit"}
              {!isEditing && (
                <span className="ml-2 text-xs font-normal opacity-70">1 credit</span>
              )}
            </button>

            {/* Progress */}
            {isEditing && (
              <div className="flex justify-center">
                <GenerationProgress isGenerating={isEditing} variant="clipart" />
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Result actions */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                  Edit complete
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadClip(result.imageUrl, `${result.generation.slug}.png`)}
                    className="btn-primary py-3 text-sm"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleEditAgain}
                    className="btn-secondary py-3 text-sm"
                  >
                    Edit Again
                  </button>
                </div>
                <Link
                  href="/my-art"
                  className="block text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  View in My Creations →
                </Link>
              </motion.div>
            )}

            {/* Credit info */}
            <p className="text-center text-xs text-gray-300">
              Each edit costs 1 credit. Results are saved to My Creations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePicker({ onSelect }: { onSelect: (img: SourceImage) => void }) {
  const { user } = useAppStore();
  const [images, setImages] = useState<SourceImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadImages() {
      const supabase = createBrowserClient();
      if (!supabase) return;

      const { data } = await supabase
        .from("generations")
        .select("id, image_url, title, slug, category, style, aspect_ratio")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(60);

      setImages(
        (data || []).map((d) => ({
          id: d.id,
          url: d.image_url,
          title: d.title || "Untitled",
          slug: d.slug || d.id,
          category: d.category || "free",
          style: d.style || "flat",
          aspect_ratio: d.aspect_ratio,
        })),
      );
      setLoading(false);
    }

    loadImages();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Edit your images</h2>
        <p className="max-w-sm text-sm text-gray-400">
          Sign in to edit your generated images with AI. Remove backgrounds, change colors, add outlines, and more.
        </p>
        <Link href="/create" className="btn-primary mt-2 px-6 py-3 text-sm">
          Create an image first
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">No images yet</h2>
        <p className="max-w-sm text-sm text-gray-400">
          Create some images first, then come back here to edit them.
        </p>
        <Link href="/create" className="btn-primary mt-2 px-6 py-3 text-sm">
          Start Creating
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Select an image to edit</h1>
        <p className="text-sm text-gray-400">Choose from your recent creations</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => onSelect(img)}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg"
          >
            <div className={`relative bg-gray-50 ${img.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
              <Image
                src={img.url}
                alt={img.title}
                fill
                className="object-contain p-3 transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                unoptimized
              />
            </div>
            <div className="px-3 py-2">
              <p className="truncate text-xs font-medium text-gray-600">{img.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
        </div>
      }
    >
      <EditPageInner />
    </Suspense>
  );
}
