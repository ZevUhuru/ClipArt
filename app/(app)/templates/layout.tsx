import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clip Art Templates — AI Prompt Ideas & Inspiration",
  description:
    "Browse popular clip art prompts and templates. Get inspiration for AI-generated clip art, coloring pages, and illustrations. One-click to create from any template.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/templates",
  },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
