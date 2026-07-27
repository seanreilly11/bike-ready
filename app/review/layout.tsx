import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Fix your mistakes - answer a question right once and it leaves the review queue.",
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
