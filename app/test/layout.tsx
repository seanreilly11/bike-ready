import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test",
  description:
    "Take the CycleDutch Test - 20 questions across all modules. Pass to earn your CycleDutch badge.",
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
