import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse — Clip Art & Coloring Pages",
  description:
    "Browse AI-generated clip art and coloring pages. Filter by category, style, and content type. Download free illustrations instantly.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
