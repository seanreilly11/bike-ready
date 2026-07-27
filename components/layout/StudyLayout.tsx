import type { ReactNode } from "react";

interface StudyLayoutProps {
  reading: ReactNode;
  rail: ReactNode;
}

// Desktop study layout: a reading-width column (vertically centered) plus a
// sticky context rail. Single column on mobile - the rail is hidden there.
export default function StudyLayout({ reading, rail }: StudyLayoutProps) {
  return (
    <div className="mx-auto max-w-2xl lg:max-w-5xl px-5 py-6 lg:py-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,640px)_300px] lg:justify-center lg:gap-10 lg:items-start">
        <div className="min-w-0">{reading}</div>
        <aside className="hidden lg:block lg:sticky lg:top-[120px]">
          {rail}
        </aside>
      </div>
    </div>
  );
}
