import { create } from "zustand";

type AuthModalMode = "signin" | "signup" | null;

interface AppState {
  user: { id: string; email: string } | null;
  credits: number;
  authModalMode: AuthModalMode;
  isBuyCreditsOpen: boolean;

  setUser: (user: { id: string; email: string } | null) => void;
  setCredits: (credits: number) => void;
  decrementCredits: () => void;
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

  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),
  decrementCredits: () => set((s) => ({ credits: Math.max(0, s.credits - 1) })),
  openAuthModal: (mode) => set({ authModalMode: mode }),
  closeAuthModal: () => set({ authModalMode: null }),
  openBuyCreditsModal: () => set({ isBuyCreditsOpen: true }),
  closeBuyCreditsModal: () => set({ isBuyCreditsOpen: false }),
}));
