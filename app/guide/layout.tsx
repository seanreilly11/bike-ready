import type { Metadata } from "next";
import GuideShell from "@/components/layout/GuideShell";

export const metadata: Metadata = {
  // A plain-string title here would strip the root template from child guide
  // pages (signs/glossary/[moduleId]). Re-declare it so they keep "— BikeReady".
  title: { default: "Guide", template: "%s — BikeReady" },
  description:
    "Reference guide to Dutch cycling rules, road signs, and vocabulary for expats.",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuideShell>{children}</GuideShell>;
}
