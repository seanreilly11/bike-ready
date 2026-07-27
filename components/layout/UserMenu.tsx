"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { PREMIUM_ENABLED } from "@/lib/config";

interface UserMenuProps {
  user: User;
  isPremium: boolean;
  onUnlock: () => void;
  onSignOut: () => void;
}

export default function UserMenu({ user, isPremium, onUnlock, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        className={[
          "relative w-8 h-8 rounded-full border flex items-center justify-center",
          "text-sm font-display font-bold text-stone-900",
          "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
          PREMIUM_ENABLED && isPremium
            ? "bg-gold-light border-gold hover:bg-gold/25"
            : "bg-stone-100 border-stone-200 hover:bg-stone-200",
        ].join(" ")}
      >
        {initial}
        {PREMIUM_ENABLED && isPremium && (
          // Ring matches the nav background so the star reads as a separate
          // element rather than a smudge on the avatar edge.
          <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white ring-2 ring-white">
            <Star size={10} fill="currentColor" className="text-gold" aria-hidden="true" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg z-50">
          {/* Email */}
          <div className="px-3 py-2.5">
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>

          <hr className="border-stone-100" />

          {/* Premium status or upsell */}
          {PREMIUM_ENABLED && (
            <>
              {isPremium ? (
                // Status, not an action - same rhythm as the menu buttons but
                // no hover or cursor affordance.
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-display font-medium text-stone-900">
                  <Star
                    size={14}
                    fill="currentColor"
                    className="text-gold"
                    aria-hidden="true"
                  />
                  Premium
                </div>
              ) : (
                <button
                  onClick={() => { onUnlock(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm font-display font-medium text-orange hover:bg-stone-50 transition-colors"
                >
                  Go Premium <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
              <hr className="border-stone-100" />
            </>
          )}

          {/* Sign out */}
          <button
            onClick={() => { onSignOut(); setIsOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-b-xl transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
