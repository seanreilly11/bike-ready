import GuideShell from "@/components/layout/GuideShell";

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuideShell>{children}</GuideShell>;
}
