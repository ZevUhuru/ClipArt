"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

interface Short {
  id: string;
  name: string;
  cover_image_url: string | null;
  item_count: number;
  updated_at: string;
  created_at: string;
}

const HOLE_W = 8;
const HOLE_H = 5;

function FilmHoles({ count = 6 }: { count?: number }) {
  return (
    <div className="flex items-center gap-[5px] px-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 rounded-[1.5px] bg-gray-700/70"
          style={{ width: HOLE_W, height: HOLE_H }}
        />
      ))}
    </div>
  );
}

function ShortCard({ short }: { short: Short }) {
  return (
    <Link
      href={`/storyboard/${short.id}`}
      className="group overflow-hidden rounded-2xl bg-[#1c1c27] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
    >
      {/* Top sprocket strip */}
      <div className="flex flex-col gap-[3px] py-1.5">
        <FilmHoles count={8} />
      </div>

      {/* Frame */}
      <div className="relative mx-3 overflow-hidden rounded-sm bg-black/30" style={{ aspectRatio: "16/9" }}>
        {short.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={short.cover_image_url}
            alt={short.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125" />
            </svg>
            <span className="text-[10px] font-medium text-white/20">No clips yet</span>
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <svg className="h-4 w-4 translate-x-0.5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
        </div>

        {/* Shot count badge */}
        {short.item_count > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white/80 backdrop-blur-sm">
            {short.item_count} shot{short.item_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Bottom sprocket strip */}
      <div className="flex flex-col gap-[3px] py-1.5">
        <FilmHoles count={8} />
      </div>

      {/* Title row */}
      <div className="px-3 pb-3 pt-1">
        <p className="truncate text-sm font-semibold text-white/90">{short.name}</p>
        <p className="mt-0.5 text-[11px] text-white/30">
          {new Date(short.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

function NewShortButton({ onCreate }: { onCreate: (short: Short) => void }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/me/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), project_type: "short" }),
      });
      const data = await res.json();
      if (data.project) {
        onCreate(data.project);
        router.push(`/storyboard/${data.project.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  if (showInput) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 overflow-hidden rounded-2xl bg-[#1c1c27] p-3"
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") { setShowInput(false); setName(""); }
          }}
          placeholder="Short name…"
          className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30"
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create"}
        </button>
        <button
          onClick={() => { setShowInput(false); setName(""); }}
          className="rounded-lg p-1.5 text-white/30 hover:text-white/60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="group flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-gray-700 bg-[#1c1c27]/50 py-10 transition-all hover:border-gray-500 hover:bg-[#1c1c27]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-white/15">
        <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <span className="text-sm font-medium text-white/40 group-hover:text-white/60">New short</span>
    </button>
  );
}

export default function ShortsPage() {
  const { user, openAuthModal } = useAppStore();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (user === null) openAuthModal("signin");
      return;
    }
    fetch("/api/me/projects")
      .then((r) => r.json())
      .then((d) =>
        setShorts(
          (d.projects || []).filter((p: Short & { project_type: string }) => p.project_type === "short"),
        ),
      )
      .finally(() => setLoading(false));
  }, [user, openAuthModal]);

  return (
    <div className="min-h-screen bg-gray-950 px-6 pb-12 pt-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-futura text-2xl font-bold text-white">Storyboard</h1>
            <p className="mt-1 text-sm text-white/40">
              Sequence clips into animated films
            </p>
          </div>
          {!loading && shorts.length > 0 && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/50">
              {shorts.length} project{shorts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-[#1c1c27]">
                <div className="py-2">
                  <div className="mx-2 h-1.5 rounded bg-gray-700/50" />
                </div>
                <div className="mx-3 aspect-video rounded-sm bg-gray-800/50" />
                <div className="py-2">
                  <div className="mx-2 h-1.5 rounded bg-gray-700/50" />
                </div>
                <div className="px-3 pb-3 pt-1">
                  <div className="h-3 w-2/3 rounded bg-gray-700/50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* New short card always first */}
              <NewShortButton
                onCreate={(short) => setShorts((prev) => [short, ...prev])}
              />

              {shorts.map((short) => (
                <motion.div
                  key={short.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ShortCard short={short} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {!loading && shorts.length === 0 && (
          <p className="mt-4 text-center text-sm text-white/30">
            Name your first short above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
