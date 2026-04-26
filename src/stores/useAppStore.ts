import { create } from "zustand";

type AuthModalMode = "signin" | "signup" | null;

export interface Generation {
  id: string;
  image_url: string;
  prompt: string;
  title?: string | null;
  style: string;
  content_type?: string;
  category: string | null;
  slug: string | null;
  aspect_ratio?: string;
  model?: string | null;
  has_transparency?: boolean | null;
  created_at: string;
}

interface AppState {
  user: { id: string; email: string } | null;
  credits: number;
  authModalMode: AuthModalMode;
  isBuyCreditsOpen: boolean;
  generations: Generation[];
  generationsLoaded: boolean;

  setUser: (user: { id: string; email: string } | null) => void;
  setCredits: (credits: number) => void;
  decrementCredits: () => void;
  setGenerations: (generations: Generation[]) => void;
  prependGeneration: (generation: Generation) => void;
  resetUserState: () => void;
  openAuthModal: (mode: "signin" | "signup") => void;
  closeAuthModal: () => void;
  openBuyCreditsModal: () => void;
  closeBuyCreditsModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  credits: 0,
  authModalMode: null,
  isBuyCreditsOpen: false,
  generations: [],
  generationsLoaded: false,

  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),
  decrementCredits: () => set((s) => ({ credits: Math.max(0, s.credits - 1) })),
  setGenerations: (generations) => set({ generations, generationsLoaded: true }),
  prependGeneration: (generation) =>
    set((s) => ({ generations: [generation, ...s.generations] })),
  resetUserState: () =>
    set({ user: null, credits: 0, generations: [], generationsLoaded: false }),
  openAuthModal: (mode) => set({ authModalMode: mode }),
  closeAuthModal: () => set({ authModalMode: null }),
  openBuyCreditsModal: () => set({ isBuyCreditsOpen: true }),
  closeBuyCreditsModal: () => set({ isBuyCreditsOpen: false }),
}));
