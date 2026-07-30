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
import AuthBootstrap from "@/components/layout/AuthBootstrap";
import { Suspense } from "react";
import { PostHogPageView } from "@/components/PostHogPageView";
import JsonLd from "@/components/seo/JsonLd";
import {
  OG_DEFAULTS,
  SITE_URL,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CycleDutch - Cycle safely in the Netherlands",
    template: "%s - CycleDutch",
  },
  description:
    "Learn Dutch road rules, signs, and bike priority before your first ride. A short preparation course for expats learning to cycle safely in the Netherlands.",
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body className="antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <PHProvider>
          <AuthBootstrap />
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
