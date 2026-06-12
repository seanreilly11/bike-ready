import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { Footer } from "@/components/layout/Footer";
import { PHProvider } from "./providers";
import { Suspense } from "react";
import { PostHogPageView } from "@/components/PostHogPageView";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bikeready.nl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BikeReady — Cycle safely in the Netherlands",
    template: "%s — BikeReady",
  },
  description:
    "A short preparation course for expats learning to cycle safely in Dutch cities.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "BikeReady",
                  url: SITE_URL,
                },
                {
                  "@type": "WebSite",
                  name: "BikeReady",
                  url: SITE_URL,
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <PHProvider>
          <Suspense>
            <PostHogPageView />
          </Suspense>
          {children}
          {process.env.NODE_ENV === "production" && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
          <Footer />
          <CookieConsentBanner />
        </PHProvider>
      </body>
    </html>
  );
}
