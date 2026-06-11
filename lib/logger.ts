import * as Sentry from "@sentry/nextjs";

export function logError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  Sentry.captureException(error);
}
