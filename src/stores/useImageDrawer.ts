import { create } from "zustand";

export interface DrawerImage {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  style: string;
}

interface ImageDrawerState {
  image: DrawerImage | null;
  open: (image: DrawerImage) => void;
  close: () => void;
}

export const useImageDrawer = create<ImageDrawerState>((set) => ({
  image: null,
  open: (image) => set({ image }),
  close: () => set({ image: null }),
}));
