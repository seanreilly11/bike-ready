import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Fix your mistakes - answer a question right once and it leaves the review queue.",
  alternates: { canonical: "/review" },
  // Personal, empty without progress, nothing to rank. `follow` so the nav
  // links out of here still pass through. robots.txt intentionally allows
  // crawling so this tag can actually be read.
  robots: { index: false, follow: true },
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
