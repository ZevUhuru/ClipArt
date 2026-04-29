import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://clip.art"),
  title: {
    default: "Clip Art — AI Clip Art Generator",
    template: "%s | clip.art",
  },
  description:
    "Generate reusable transparent clip art in seconds. Describe what you need, choose a style, and download assets for classrooms, shops, crafts, and design.",
  alternates: {
    canonical: "https://clip.art",
  },
  openGraph: {
    title: "clip.art — AI Clip Art Generator",
    description:
      "Generate reusable transparent clip art for classrooms, shops, crafts, and everyday design.",
    url: "https://clip.art",
    siteName: "clip.art",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@clipart",
    title: "clip.art — AI Clip Art Generator",
    description:
      "Generate reusable transparent clip art for classrooms, shops, crafts, and everyday design.",
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
        <link rel="stylesheet" href="https://use.typekit.net/qau0npc.css" />
      </head>
      <body className="font-body antialiased">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <Providers>{children}</Providers>
        {GTM_ID && (
          <Script
            id="gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
      </body>
    </html>
  );
}
