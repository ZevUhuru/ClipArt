import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clip Art — AI Clip Art Generator",
  description:
    "Generate beautiful clip art in seconds. Describe what you want, pick a style, and download instantly. No license needed.",
  openGraph: {
    title: "Clip Art — AI Clip Art Generator",
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
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
