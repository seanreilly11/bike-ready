import type { Metadata } from "next";
import modules from "@/data/modules";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return { title: "Learn" };
  return {
    title: mod.title,
    description: mod.description,
  };
}

export default function ModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
