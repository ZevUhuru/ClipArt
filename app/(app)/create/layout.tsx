import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Clip Art Generator — Create Custom Clip Art",
  description:
    "Generate custom clip art in seconds with AI. Choose from flat, cartoon, watercolor, sticker, pixel, and more styles. Free for personal and commercial use.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/create",
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
