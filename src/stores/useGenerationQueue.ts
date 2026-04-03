import { create } from "zustand";
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

interface GenerationQueueState {
  jobs: QueuedGeneration[];
  addJob: (prompt: string, style: string, isPublic: boolean) => void;
  updateJob: (id: string, partial: Partial<QueuedGeneration>) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
}

export const useGenerationQueue = create<GenerationQueueState>((set, get) => ({
  jobs: [],

  addJob: (prompt, style, isPublic) => {
    const id = crypto.randomUUID();
    const job: QueuedGeneration = {
      id,
      prompt,
      style,
      status: "generating",
      startedAt: Date.now(),
    };

    set((s) => ({ jobs: [job, ...s.jobs] }));

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, style, isPublic }),
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
}));
