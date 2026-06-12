import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Work through scenario-based questions across six modules and build safe Dutch cycling instincts.",
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
