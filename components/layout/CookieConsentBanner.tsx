"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

const CONSENT_KEY = "bikeready_cookie_consent";
export const COOKIE_SETTINGS_EVENT = "bikeready:open-cookie-settings";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    const handler = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handler);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-700 bg-stone-900 px-4 py-4">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-300">
          We use cookies to understand how the app is used — anonymised, no
          personal data. Essential cookies (login session) are always on.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-300 hover:text-white"
            onClick={decline}
          >
            Decline
          </Button>
          <Button variant="primary" size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
