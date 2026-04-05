import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Illustration Generator — Create Custom Illustrations",
  description:
    "Generate beautiful illustrations with AI. Full scenes with detailed backgrounds in storybook, fantasy, watercolor, anime, and more styles. Free for any use.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/create/illustrations",
  },
};

export default function IllustrationCreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
