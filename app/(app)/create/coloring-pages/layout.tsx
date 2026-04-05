import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Coloring Page Generator — Create Printable Coloring Pages",
  description:
    "Generate printable coloring pages with AI. Create custom coloring sheets for kids, classrooms, and relaxation. Bold outlines, optimized for printing.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/create/coloring-pages",
  },
};

export default function ColoringCreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
