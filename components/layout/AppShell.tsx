"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/layout/Nav";
import BottomNav from "@/components/layout/BottomNav";
import AuthModal from "@/components/layout/AuthModal";
import { useUIStore } from "@/stores/uiStore";

interface AppShellProps {
  children: React.ReactNode;
  wrongCount?: number;
  logoOnly?: boolean;
}

export default function AppShell({
  children,
  wrongCount = 0,
  logoOnly,
}: AppShellProps) {
  const pathname = usePathname();
  const showAuth = useUIStore((s) => s.showAuth);
  const authReason = useUIStore((s) => s.authReason);
  const closeAuth = useUIStore((s) => s.closeAuth);

  // Hide bottom nav during module sessions — back button handles navigation there
  const showBottomNav = !pathname.startsWith("/learn/");

  return (
    <>
      <Nav
        currentRoute={pathname}
        wrongCount={wrongCount}
        logoOnly={logoOnly}
      />
      {showAuth && authReason && (
        <AuthModal reason={authReason} onClose={closeAuth} />
      )}
      {children}
      {showBottomNav && (
        <BottomNav currentRoute={pathname} wrongCount={wrongCount} />
      )}
    </>
  );
}
