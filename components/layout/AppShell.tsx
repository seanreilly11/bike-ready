"use client";

import { usePathname, useRouter } from "next/navigation";
import Nav from "@/components/layout/Nav";
import BottomNav from "@/components/layout/BottomNav";
import AuthModal from "@/components/layout/AuthModal";
import GateModal from "@/components/layout/GateModal";
import modules from "@/data/modules";
import { useUIStore } from "@/stores/uiStore";
import { useUnlock } from "@/hooks/useUnlock";

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
  const router = useRouter();
  const showAuth = useUIStore((s) => s.showAuth);
  const authReason = useUIStore((s) => s.authReason);
  const closeAuth = useUIStore((s) => s.closeAuth);
  const showGate = useUIStore((s) => s.showGate);
  const gateModuleId = useUIStore((s) => s.gateModuleId);
  const closeGate = useUIStore((s) => s.closeGate);
  const checkoutError = useUIStore((s) => s.checkoutError);
  const setCheckoutError = useUIStore((s) => s.setCheckoutError);
  const handleUnlock = useUnlock(closeGate);

  const gateModuleIndex = modules.findIndex((m) => m.id === gateModuleId);
  const gateModule = gateModuleIndex >= 0 ? modules[gateModuleIndex] : null;
  const nextModule =
    gateModule && gateModuleIndex + 1 < modules.length
      ? modules[gateModuleIndex + 1]
      : null;

  // Hide bottom nav during module sessions — back button handles navigation there
  const showBottomNav = !pathname.startsWith("/learn/");

  return (
    <>
      <Nav
        currentRoute={pathname}
        wrongCount={wrongCount}
        logoOnly={logoOnly}
      />
      {checkoutError && (
        <div className="bg-red-light border-b border-red text-red-dark px-5 py-3 flex items-center justify-between gap-3 animate-fade-up">
          <span className="text-sm font-display font-medium">
            {checkoutError}
          </span>
          <button
            onClick={() => setCheckoutError(null)}
            className="text-red-dark/70 hover:text-red-dark text-sm font-display shrink-0 focus-visible:outline-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {showAuth && authReason && (
        <AuthModal reason={authReason} onClose={closeAuth} />
      )}
      {showGate && (
        <GateModal
          moduleId={gateModule?.id ?? null}
          moduleName={gateModule?.title ?? null}
          nextModule={nextModule}
          onUnlock={handleUnlock}
          onNextModule={(id) => {
            closeGate();
            router.push(`/learn/${id}`);
          }}
          onDismiss={closeGate}
        />
      )}
      {children}
      {showBottomNav && (
        <BottomNav currentRoute={pathname} wrongCount={wrongCount} />
      )}
    </>
  );
}
