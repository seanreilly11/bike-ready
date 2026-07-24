import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { validateEnv } from "./lib/validateEnv";

validateEnv();

// Allowed remote origins: Supabase (REST + realtime), PostHog (EU + US
// clouds, incl. lazily-loaded recorder script), Sentry ingest, Google Fonts,
// Paddle (checkout overlay). Next.js inline bootstrap scripts require
// 'unsafe-inline' without nonces. Dev (Turbopack) needs 'unsafe-eval' for
// source maps and React's debug features; production keeps a strict script-src
// - React never uses eval there.
//
// Paddle: Paddle.js loads from cdn.paddle.com and the overlay checkout renders
// in an iframe from *.paddle.com (buy./sandbox-buy.) with API calls to
// *.paddle.com. frame-src must be set explicitly or the iframe falls back to
// default-src 'self' and is blocked. See developer.paddle.com/paddle-js.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.i.posthog.com https://*.posthog.com https://*.paddle.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.paddle.com",
  "font-src 'self' https://fonts.gstatic.com https://*.paddle.com",
  "img-src 'self' data: blob: https://*.paddle.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.i.posthog.com https://*.posthog.com https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io https://*.paddle.com",
  "frame-src 'self' https://*.paddle.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG,

  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
