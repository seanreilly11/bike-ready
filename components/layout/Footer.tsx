"use client";

import Link from "next/link";
import { COOKIE_SETTINGS_EVENT } from "@/components/layout/CookieConsentBanner";
import { PREMIUM_ENABLED } from "@/lib/config";

export function Footer() {
  function openCookieSettings() {
    window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
  }

  return (
    <footer className="border-t border-stone-200 py-5 px-5">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} CycleDutch
        </p>
        <nav className="flex items-center gap-4" aria-label="Footer">
          <Link
            href="/privacy"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
          >
            Privacy policy
          </Link>
          {PREMIUM_ENABLED && (
            <Link
              href="/terms"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
            >
              Terms of service
            </Link>
          )}
          <Link
            href="/cookies"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
          >
            Cookie policy
          </Link>
          <Link
            href="/imprint"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
          >
            Imprint
          </Link>
          <button
            onClick={openCookieSettings}
            type="button"
            className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
          >
            Cookie settings
          </button>
        </nav>
      </div>
    </footer>
  );
}
