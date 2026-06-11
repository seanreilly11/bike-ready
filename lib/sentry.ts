import * as Sentry from "@sentry/nextjs";

// Shared across instrumentation-client.ts, sentry.server.config.ts and
// sentry.edge.config.ts so all three runtimes apply the same enable rule
// and PII scrubbing.
export const sentryOptions: Sentry.NodeOptions | Sentry.BrowserOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.VERCEL_ENV === "production",
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
};
