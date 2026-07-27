import { ImageResponse } from "next/og";
import guides from "@/data/guides.json";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Pre-render one OG card per guide at build time.
export function generateStaticParams() {
  return guides.map((g) => ({ moduleId: g.moduleId }));
}

export default async function GuideOpengraphImage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const guide = guides.find((g) => g.moduleId === moduleId);
  const heading = guide?.h1 ?? guide?.title ?? "Dutch Cycling Guide";
  const subtitle =
    guide?.subtitle ?? "Cycle safely in the Netherlands";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#E8500A",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 64, display: "flex" }}>🚲</div>
          <div style={{ fontSize: 36, fontWeight: 700, display: "flex" }}>
            CycleDutch
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            {heading}
          </div>
          <div
            style={{
              fontSize: 32,
              marginTop: 24,
              opacity: 0.9,
              display: "flex",
              maxWidth: 980,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ fontSize: 26, opacity: 0.85, display: "flex" }}>
          Dutch cycling guide for expats
        </div>
      </div>
    ),
    { ...size },
  );
}
