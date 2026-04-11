"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  name: string;
  project_type: "collection" | "short";
  item_count: number;
}

interface Props {
  /** ID of the generation to add */
  generationId?: string;
  /** ID of the animation to add */
  animationId?: string;
  /** Trigger element – render as children, or use the default button */
  children?: React.ReactNode;
  onAdded?: (projectId: string) => void;
}

export function AddToProjectPopover({
  generationId,
  animationId,
  children,
  onAdded,
}: Props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [creatingName, setCreatingName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/me/projects")
      .then((r) => r.json())
      .then((d) => setProjects((d.projects || []).filter((p: Project) => p.project_type === "collection")))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleAdd(projectId: string) {
    if (adding) return;
    setAdding(projectId);
    try {
      await fetch(`/api/me/projects/${projectId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type: "asset",
          generation_id: generationId || null,
          animation_id: animationId || null,
        }),
      });
      setAdded((prev) => [...prev, projectId]);
      onAdded?.(projectId);
    } finally {
      setAdding(null);
    }
  }

  async function handleCreate() {
    if (!creatingName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/me/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: creatingName.trim(), project_type: "collection" }),
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setShowCreate(false);
        setCreatingName("");
        await handleAdd(data.project.id);
      }
    } finally {
      setCreating(false);
    }
  }

  const trigger = children ?? (
    <button
      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      title="Add to project"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      </svg>
    </button>
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Add to collection
              </p>
            </div>

            <div className="max-h-52 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                </div>
              ) : projects.length === 0 && !showCreate ? (
                <div className="py-4 text-center text-xs text-gray-400">
                  No collections yet.
                </div>
              ) : (
                projects.map((project) => {
                  const isAdded = added.includes(project.id);
                  return (
                    <button
                      key={project.id}
                      onClick={() => !isAdded && handleAdd(project.id)}
                      disabled={!!adding || isAdded}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isAdded
                          ? "text-emerald-600"
                          : "text-gray-700 hover:bg-gray-50"
                      } disabled:cursor-default`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        {isAdded ? (
                          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : adding === project.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-pink-500" />
                        ) : (
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{project.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {project.item_count} item{project.item_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Inline create */}
              {showCreate && (
                <div className="border-t border-gray-100 px-3 py-2">
                  <input
                    autoFocus
                    value={creatingName}
                    onChange={(e) => setCreatingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") { setShowCreate(false); setCreatingName(""); }
                    }}
                    placeholder="Collection name…"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleCreate}
                      disabled={!creatingName.trim() || creating}
                      className="flex-1 rounded-lg bg-gray-900 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {creating ? "Creating…" : "Create & add"}
                    </button>
                    <button
                      onClick={() => { setShowCreate(false); setCreatingName(""); }}
                      className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!showCreate && (
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New collection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
