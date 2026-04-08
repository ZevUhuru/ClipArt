import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Image Editor — Edit Clip Art & Illustrations",
  description:
    "Edit and transform clip art, illustrations, and coloring pages with AI. Remove backgrounds, change styles, and refine your images instantly.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/edit",
  },
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
