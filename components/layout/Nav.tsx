"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/layout/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { useUnlock } from "@/hooks/useUnlock";

interface NavProps {
  currentRoute: string;
  wrongCount: number;
  logoOnly?: boolean;
}

function SignInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="4.5" r="2" />
      <path d="M3 13.5c0-2.21 1.79-4 4-4s4 1.79 4 4" />
      <line x1="10" y1="8" x2="14.5" y2="8" />
      <polyline points="12.5 6 14.5 8 12.5 10" />
    </svg>
  );
}

const navItems = [
  { href: "/learn", label: "Practice" },
  { href: "/review", label: "Review" },
  { href: "/guide", label: "Guide" },
  { href: "/test", label: "Test" },
];

export default function Nav({
  currentRoute,
  wrongCount,
  logoOnly = false,
}: NavProps) {
  const { user, isPremium, isLoading, signOut } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const handleUnlock = useUnlock();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display font-extrabold text-lg text-stone-900 tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
        >
          BikeReady
        </Link>

        {/* Nav items + auth */}
        {!logoOnly && (
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                  currentRoute.startsWith(item.href)
                    ? "text-orange"
                    : "text-stone-600 hover:text-stone-900",
                ].join(" ")}
              >
                {item.label}
                {currentRoute.startsWith(item.href) && (
                  <span
                    className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-orange"
                    aria-hidden="true"
                  />
                )}
                {item.label === "Review" && wrongCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-red animate-pulse"
                    aria-label={`${wrongCount} questions to review`}
                  />
                )}
              </Link>
            ))}

            <div className="ml-2">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              ) : user ? (
                <UserMenu
                  user={user}
                  isPremium={isPremium}
                  onUnlock={handleUnlock}
                  onSignOut={signOut}
                />
              ) : (
                <>
                  <button
                    className="sm:hidden p-2.5 rounded-lg text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                    onClick={() => openAuth("save_progress")}
                    aria-label="Sign in"
                  >
                    <SignInIcon />
                  </button>
                  <span className="hidden sm:block">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAuth("save_progress")}
                    >
                      Sign in
                    </Button>
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
