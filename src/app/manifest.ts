import type { MetadataRoute } from "next";

/** Permite instalar alive como app desde Chrome o Edge (ícono propio, ventana sin barra del navegador). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "alive",
    short_name: "alive",
    description: "Live intentionally. Tu Life OS personal.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
