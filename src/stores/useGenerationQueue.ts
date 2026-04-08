import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAppStore } from "./useAppStore";

export interface QueuedGeneration {
  id: string;
  prompt: string;
  style: string;
  status: "generating" | "completed" | "failed";
  imageUrl?: string;
  generationId?: string;
  error?: string;
  startedAt: number;
}

interface AddJobOptions {
  contentType?: string;
  aspectRatio?: string;
}

interface GenerationQueueState {
  jobs: QueuedGeneration[];
  addJob: (prompt: string, style: string, isPublic: boolean, options?: AddJobOptions) => void;
  updateJob: (id: string, partial: Partial<QueuedGeneration>) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
}

export const useGenerationQueue = create<GenerationQueueState>()(
  persist(
    (set, get) => ({
  jobs: [],

  addJob: (prompt, style, isPublic, options) => {
    const id = crypto.randomUUID();
    const job: QueuedGeneration = {
      id,
      prompt,
      style,
      status: "generating",
      startedAt: Date.now(),
    };

    set((s) => ({ jobs: [job, ...s.jobs] }));

    const body: Record<string, unknown> = { prompt, style, isPublic };
    if (options?.contentType) body.contentType = options.contentType;
    if (options?.aspectRatio) body.aspectRatio = options.aspectRatio;

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.status === 402 && data.requiresCredits) {
          get().updateJob(id, { status: "failed", error: "Not enough credits" });
          useAppStore.getState().openBuyCreditsModal();
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Generation failed");
        }

        if (typeof data.credits === "number") {
          useAppStore.getState().setCredits(data.credits);
        }

        if (data.generation) {
          useAppStore.getState().prependGeneration(data.generation);
        }

        get().updateJob(id, {
          status: "completed",
          imageUrl: data.imageUrl || data.generation?.image_url,
          generationId: data.generation?.id,
        });
      })
      .catch((err) => {
        get().updateJob(id, {
          status: "failed",
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      });
  },

  updateJob: (id, partial) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...partial } : j)),
    }));
  },

  removeJob: (id) => {
    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
  },

  clearCompleted: () => {
    set((s) => ({ jobs: s.jobs.filter((j) => j.status === "generating") }));
  },
    }),
    {
      name: "generation-queue",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const raw = sessionStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (parsed?.state?.jobs) {
            parsed.state.jobs = parsed.state.jobs.filter(
              (j: QueuedGeneration) => j.status !== "generating",
            );
          }
          return parsed;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      partialize: (state) => ({ jobs: state.jobs }) as GenerationQueueState,
    },
  ),
);
