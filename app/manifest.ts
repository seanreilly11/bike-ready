import type { MetadataRoute } from "next";
import { colors } from "@/lib/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BikeReady — Cycle safely in the Netherlands",
    short_name: "BikeReady",
    description:
      "Learn Dutch road rules, signs, and bike priority before your first ride.",
    start_url: "/",
    display: "standalone",
    background_color: colors.stone50,
    theme_color: colors.orange,
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
