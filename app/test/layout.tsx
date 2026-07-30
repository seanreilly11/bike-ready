import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test",
  description:
    "Take the CycleDutch Test - 20 questions across all modules. Pass to earn your CycleDutch badge.",
  alternates: { canonical: "/test" },
  // See /review: gated, stateful, nothing crawlable. Allowed in robots.txt
  // precisely so this noindex is readable.
  robots: { index: false, follow: true },
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
