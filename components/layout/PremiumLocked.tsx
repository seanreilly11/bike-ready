"use client";

import { Lock } from "lucide-react";
import AppShell from "./AppShell";
import Button from "../ui/Button";
import { APP_PRICE } from "@/data/constants";
import { useUnlock } from "@/hooks/useUnlock";

type Props = {
  title: string;
  body: string;
};

const PremiumLocked = ({ title, body }: Props) => {
  const unlock = useUnlock();

  return (
    <AppShell wrongCount={0}>
      <main className="min-h-screen bg-stone-50 flex items-center justify-center mt-[-60px]">
        <div className="max-w-2xl px-5 text-center">
          <div className="mb-3 flex justify-center"><Lock size={40} className="text-stone-400" aria-hidden="true" /></div>
          <h1 className="font-display font-bold text-xl text-stone-900 mb-2">
            {title}
          </h1>
          <p className="text-stone-600 text-sm mb-6">{body}</p>
          <Button size="lg" onClick={() => unlock()}>
            Unlock for {APP_PRICE}
          </Button>
        </div>
      </main>
    </AppShell>
  );
};

export default PremiumLocked;
