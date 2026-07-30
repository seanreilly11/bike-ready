import type { Metadata } from "next";
import modules from "@/data/modules";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return { title: "Practice" };
  return {
    title: mod.title,
    description: mod.description,
    // Overrides the parent layout's /learn canonical, which would otherwise
    // point every module page at the index.
    alternates: { canonical: `/learn/${mod.id}` },
  };
}

export default function ModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
