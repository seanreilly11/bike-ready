import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const monoFont = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { Footer } from "@/components/layout/Footer";
import { PHProvider } from "./providers";
import { Suspense } from "react";
import { PostHogPageView } from "@/components/PostHogPageView";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CycleDutch — Cycle safely in the Netherlands",
    template: "%s — CycleDutch",
  },
  description:
    "Learn Dutch road rules, signs, and bike priority before your first ride. A short preparation course for expats learning to cycle safely in the Netherlands.",
  openGraph: {
    siteName: "CycleDutch",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${monoFont.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "CycleDutch",
                  url: SITE_URL,
                  logo: `${SITE_URL}/icon`,
                },
                {
                  "@type": "WebSite",
                  name: "CycleDutch",
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
