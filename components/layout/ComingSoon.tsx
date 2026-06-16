import { Clock } from "lucide-react";
import AppShell from "./AppShell";

type Props = {
  title: string;
  body: string;
};

const ComingSoon = ({ title, body }: Props) => {
  return (
    <AppShell wrongCount={0}>
      <main className="min-h-screen bg-stone-50 flex items-center justify-center mt-[-60px]">
        <div className="max-w-2xl px-5 text-center">
          <div className="mb-3 flex justify-center"><Clock size={40} className="text-stone-400" aria-hidden="true" /></div>
          <h1 className="font-display font-bold text-xl text-stone-900 mb-2">
            {title}
          </h1>
          <p className="text-stone-600 text-sm mb-2">{body}</p>
          <p className="text-stone-400 text-xs">
            We&apos;re putting the finishing touches on this.
          </p>
        </div>
      </main>
    </AppShell>
  );
};

export default ComingSoon;
