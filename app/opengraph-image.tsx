import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#E8500A",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: 160, display: "flex" }}>🚲</div>
        <div style={{ fontSize: 80, fontWeight: 700, marginTop: 24, display: "flex" }}>
          BikeReady
        </div>
        <div style={{ fontSize: 36, marginTop: 16, opacity: 0.9, display: "flex" }}>
          Cycle safely in the Netherlands
        </div>
      </div>
    ),
    { ...size },
  );
}
