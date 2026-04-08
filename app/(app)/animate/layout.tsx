import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Animation Maker — Animate Clip Art & Illustrations",
  description:
    "Turn static clip art and illustrations into animated videos with AI. Upload an image, describe the motion, and download your animation in seconds.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clip.art/animate",
  },
};

export default function AnimateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
