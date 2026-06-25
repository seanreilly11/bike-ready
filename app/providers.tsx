"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

const CONSENT_KEY = "cookie_consent";
const CONSENT_ACCEPTED_EVENT = "consent-accepted";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hasConsent = localStorage.getItem(CONSENT_KEY) === "accepted";
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host: "https://eu.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      opt_out_capturing_by_default: !hasConsent,
      persistence: "localStorage",
    });

    const handleConsentAccepted = () => posthog.opt_in_capturing();
    window.addEventListener(CONSENT_ACCEPTED_EVENT, handleConsentAccepted);
    return () =>
      window.removeEventListener(CONSENT_ACCEPTED_EVENT, handleConsentAccepted);
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
