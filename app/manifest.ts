import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AutoMe",
    short_name: "AutoMe",
    description: "Cars for sale from trusted dealerships across Egypt.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1ebe0",
    theme_color: "#17181b",
    icons: [
      { src: "/brand/autome-icon-120.png", sizes: "120x120", type: "image/png" },
      { src: "/brand/autome-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
