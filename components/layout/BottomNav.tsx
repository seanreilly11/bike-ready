"use client";

import Link from "next/link";
import { Bike, History, Map, GraduationCap } from "lucide-react";
import { PREMIUM_ENABLED } from "@/lib/config";

const navItems = [
  { href: "/learn", label: "Practice", icon: Bike },
  { href: "/review", label: "Review", icon: History },
  { href: "/guide", label: "Guide", icon: Map },
  { href: "/test", label: "Test", icon: GraduationCap },
];

interface BottomNavProps {
  currentRoute: string;
  wrongCount?: number;
}

export default function BottomNav({
  currentRoute,
  wrongCount = 0,
}: BottomNavProps) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = currentRoute.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center gap-1 px-5 py-2 text-xs font-display font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-lg",
                isActive ? "text-orange" : "text-stone-400 hover:text-stone-600",
              ].join(" ")}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {label === "Review" &&
                  wrongCount > 0 &&
                  PREMIUM_ENABLED && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red animate-pulse"
                      aria-label={`${wrongCount} questions to review`}
                    />
                  )}
              </div>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
