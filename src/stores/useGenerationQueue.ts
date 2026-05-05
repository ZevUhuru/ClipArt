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
  title?: string;
  model?: string;
  contentType?: string;
  hasTransparency?: boolean;
  error?: string;
  startedAt: number;
}

interface AddJobOptions {
  contentType?: string;
  aspectRatio?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  freeGen?: boolean;
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

    // Capture and clear prompt library attribution at submit time
    const promptLibraryUseId = useAppStore.getState().lastPromptLibraryUseId;
    if (promptLibraryUseId) {
      useAppStore.getState().setLastPromptLibraryUseId(null);
    }

    const body: Record<string, unknown> = { prompt, style, isPublic };
    if (options?.contentType) body.contentType = options.contentType;
    if (options?.aspectRatio) body.aspectRatio = options.aspectRatio;
    if (options?.grade) body.grade = options.grade;
    if (options?.subject) body.subject = options.subject;
    if (options?.topic) body.topic = options.topic;
    if (options?.freeGen) body.freeGen = true;
    if (promptLibraryUseId) {
      body.source = "prompt_library";
      body.promptLibraryUseId = promptLibraryUseId;
    }

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

        if (res.status === 401 && data.requiresAuth) {
          get().updateJob(id, { status: "failed", error: "Sign up required" });
          useAppStore.getState().openAuthModal("signup");
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

        if (data.freeGen && typeof window !== "undefined") {
          localStorage.setItem("clip_art_free_gen", "1");
        }

        get().updateJob(id, {
          status: "completed",
          imageUrl: data.imageUrl || data.generation?.image_url,
          generationId: data.generation?.id,
          title: data.generation?.title || data.title || prompt,
          model: data.generation?.model || undefined,
          contentType: data.generation?.content_type || options?.contentType || "clipart",
          hasTransparency: data.generation?.has_transparency ?? data.hasTransparency ?? false,
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Something went wrong";
        // Abort errors happen when the page refreshes or navigates away mid-request.
        // The server likely completed the generation; don't mark as failed.
        // The job stays "generating" in sessionStorage and is filtered out on next load.
        // The completed image will appear in Library.
        if (err?.name === "AbortError" || message === "Failed to fetch") return;
        get().updateJob(id, { status: "failed", error: message });
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
