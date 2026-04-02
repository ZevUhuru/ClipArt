import { create } from "zustand";

export interface QueuedAnimation {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  prompt: string;
  model: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  startedAt: number;
}

interface AnimationQueueState {
  jobs: QueuedAnimation[];
  _pollTimer: ReturnType<typeof setInterval> | null;

  addJob: (job: QueuedAnimation) => void;
  updateJob: (id: string, partial: Partial<QueuedAnimation>) => void;
  removeJob: (id: string) => void;
  loadPending: (jobs: QueuedAnimation[]) => void;
  startPolling: () => void;
  stopPolling: () => void;

  activeJobs: () => QueuedAnimation[];
  jobsForSource: (sourceUrl: string) => QueuedAnimation[];
  latestForSource: (sourceUrl: string) => QueuedAnimation | undefined;
}

async function pollJob(id: string): Promise<Partial<QueuedAnimation> | null> {
  try {
    const res = await fetch(`/api/animate/status?id=${id}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.status === "completed" && data.videoUrl) {
      return { status: "completed", videoUrl: data.videoUrl };
    }
    if (data.status === "failed" || data.status === "refunded") {
      return { status: "failed", error: data.error || "Animation failed" };
    }
    return null;
  } catch {
    return null;
  }
}

export const useAnimationQueue = create<AnimationQueueState>((set, get) => ({
  jobs: [],
  _pollTimer: null,

  addJob: (job) => {
    set((s) => ({ jobs: [job, ...s.jobs] }));
    const { _pollTimer } = get();
    if (!_pollTimer) get().startPolling();
  },

  updateJob: (id, partial) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...partial } : j)),
    }));
  },

  removeJob: (id) => {
    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
    if (get().activeJobs().length === 0) get().stopPolling();
  },

  loadPending: (pending) => {
    set((s) => {
      const existingIds = new Set(s.jobs.map((j) => j.id));
      const newJobs = pending.filter((p) => !existingIds.has(p.id));
      return { jobs: [...s.jobs, ...newJobs] };
    });
    if (get().activeJobs().length > 0 && !get()._pollTimer) {
      get().startPolling();
    }
  },

  startPolling: () => {
    const existing = get()._pollTimer;
    if (existing) return;

    const timer = setInterval(async () => {
      const active = get().activeJobs();
      if (active.length === 0) {
        get().stopPolling();
        return;
      }

      const results = await Promise.all(
        active.map(async (job) => {
          const update = await pollJob(job.id);
          return update ? { id: job.id, update } : null;
        }),
      );

      for (const r of results) {
        if (r) get().updateJob(r.id, r.update);
      }
    }, 5000);

    set({ _pollTimer: timer });
  },

  stopPolling: () => {
    const timer = get()._pollTimer;
    if (timer) {
      clearInterval(timer);
      set({ _pollTimer: null });
    }
  },

  activeJobs: () => get().jobs.filter((j) => j.status === "processing"),
  jobsForSource: (sourceUrl) => get().jobs.filter((j) => j.sourceUrl === sourceUrl),
  latestForSource: (sourceUrl) =>
    get().jobs.find((j) => j.sourceUrl === sourceUrl && j.status === "completed"),
}));
