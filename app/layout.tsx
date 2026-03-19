import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "clip.art — AI Clip Art Generator",
  description:
    "Generate beautiful clip art in seconds. Describe what you want, pick a style, and download instantly. No license needed.",
  openGraph: {
    title: "clip.art — AI Clip Art Generator",
    description:
      "Generate beautiful clip art in seconds. Describe what you want, pick a style, and download instantly.",
    url: "https://clip.art",
    siteName: "clip.art",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Futura PT via Adobe Typekit */}
        <link rel="stylesheet" href="https://use.typekit.net/qau0npc.css" />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
