import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectManifest: {
        // Uploaded book/avatar covers and API responses are never part of
        // the app shell precache - only bundle build output belongs here.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      includeAssets: ["logo_croppped.png"],
      manifest: {
        name: "Between The Covers",
        short_name: "BTC",
        description:
          "En bokklubb for en gjeng som deler en glede og kjærlighet for bøker.",
        theme_color: "#6b5b95",
        background_color: "#6b5b95",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces (IPv4 and IPv6)
    port: 5173,
  },
});
