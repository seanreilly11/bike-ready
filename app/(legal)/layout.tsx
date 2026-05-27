import Nav from "@/components/layout/Nav";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav currentRoute="" wrongCount={0} logoOnly />
      <main className="min-h-dvh bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-12">{children}</div>
      </main>
    </>
  );
}
