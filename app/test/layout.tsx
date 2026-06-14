import { notFound } from "next/navigation";
import { TEST_ENABLED } from "@/lib/config";

// Server-side gate: when the Test feature flag is off, /test 404s even on
// direct navigation. Hiding the nav link alone is not enough.
export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!TEST_ENABLED) notFound();
  return children;
}
