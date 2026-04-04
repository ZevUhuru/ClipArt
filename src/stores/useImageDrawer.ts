import { create } from "zustand";

export interface DrawerImage {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  style: string;
  aspect_ratio?: string;
  videoUrl?: string;
}

interface ImageDrawerState {
  image: DrawerImage | null;
  list: DrawerImage[];
  index: number;
  isOwner: boolean;
  open: (image: DrawerImage, list?: DrawerImage[], isOwner?: boolean) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: () => boolean;
  hasPrev: () => boolean;
}

export const useImageDrawer = create<ImageDrawerState>((set, get) => ({
  image: null,
  list: [],
  index: -1,
  isOwner: false,

  open: (image, list, isOwner) => {
    if (list && list.length > 0) {
      const idx = list.findIndex((i) => i.id === image.id);
      set({ image, list, index: idx >= 0 ? idx : 0, isOwner: isOwner ?? false });
    } else {
      set({ image, list: [], index: -1, isOwner: isOwner ?? false });
    }
  },

  close: () => set({ image: null, list: [], index: -1, isOwner: false }),

  next: () => {
    const { list, index } = get();
    if (index >= 0 && index < list.length - 1) {
      const nextIdx = index + 1;
      set({ image: list[nextIdx], index: nextIdx });
    }
  },

  prev: () => {
    const { list, index } = get();
    if (index > 0) {
      const prevIdx = index - 1;
      set({ image: list[prevIdx], index: prevIdx });
    }
  },

  hasNext: () => {
    const { list, index } = get();
    return index >= 0 && index < list.length - 1;
  },

  hasPrev: () => {
    const { list, index } = get();
    return index > 0;
  },
}));
