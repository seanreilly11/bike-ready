"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

interface NavProps {
    currentRoute: string;
    wrongCount: number;
    isPremium: boolean;
    onSignIn: () => void;
    logoOnly?: boolean;
}

const navItems = [
    { href: "/learn", label: "Learn" },
    { href: "/review", label: "Review" },
    { href: "/test", label: "Test" },
];

export default function Nav({
    currentRoute,
    wrongCount,
    isPremium,
    onSignIn,
    logoOnly = false,
}: NavProps) {
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
                {!logoOnly && <div className="flex items-center gap-1">
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
                            {item.label === "Review" && wrongCount > 0 && (
                                <span
                                    className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-red"
                                    aria-label={`${wrongCount} questions to review`}
                                />
                            )}
                        </Link>
                    ))}

                    <div className="ml-2">
                        {isPremium ? (
                            <span className="font-mono text-xs uppercase tracking-wide bg-yellow-light text-yellow-dark border border-yellow rounded-full px-2 py-1">
                                ⭐ Premium
                            </span>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onSignIn}
                            >
                                Sign in
                            </Button>
                        )}
                    </div>
                </div>}
            </div>
        </nav>
    );
}
