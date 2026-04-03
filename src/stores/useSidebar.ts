import { create } from "zustand";

const STORAGE_KEY = "clip_art_sidebar";
const WORKSPACE_ROUTES = ["/animate", "/edit"];

function readPreference(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "collapsed") return true;
    if (v === "expanded") return false;
    return null;
  } catch {
    return null;
  }
}

function writePreference(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    /* ignore */
  }
}

interface SidebarState {
  collapsed: boolean;
  hydrated: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  hydrate: (pathname: string) => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  collapsed: false,
  hydrated: false,

  toggle: () => {
    const next = !get().collapsed;
    set({ collapsed: next });
    writePreference(next);
  },

  setCollapsed: (v) => {
    set({ collapsed: v });
    writePreference(v);
  },

  hydrate: (pathname) => {
    if (get().hydrated) return;

    const saved = readPreference();
    if (saved !== null) {
      set({ collapsed: saved, hydrated: true });
    } else {
      const isWorkspace = WORKSPACE_ROUTES.some((r) => pathname.startsWith(r));
      set({ collapsed: isWorkspace, hydrated: true });
    }
  },
}));
