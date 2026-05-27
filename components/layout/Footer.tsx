"use client";

import { COOKIE_SETTINGS_EVENT } from "@/components/layout/CookieConsentBanner";

export function Footer() {
  function openCookieSettings() {
    window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
  }

  return (
    <footer className="border-t border-stone-200 py-4 px-5">
      <div className="max-w-5xl mx-auto flex items-center justify-center">
        <button
          onClick={openCookieSettings}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
        >
          Cookie settings
        </button>
      </div>
    </footer>
  );
}
