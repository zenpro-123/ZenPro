import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZenPro — Your Daily Intelligence Companion",
    short_name: "ZenPro",
    description:
      "Personalized intelligence for technology, careers, learning, opportunities, and emerging trends.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
