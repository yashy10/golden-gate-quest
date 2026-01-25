import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not guarantee `process.env` contains `.env` vars in all setups.
  // `loadEnv` ensures the dev proxy always sees `VITE_DGX_URL`.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api/dgx": {
          target: env.VITE_DGX_URL || "http://192.168.128.247:8022",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/dgx/, ""),
        },
        "/api/voice": {
          target: env.VITE_VOICE_URL || "http://localhost:8787",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/voice/, "/api"),
        },
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
        manifest: {
          name: "SF Quest - San Francisco Treasure Hunt",
          short_name: "SF Quest",
          description: "Discover San Francisco through a gamified cultural treasure hunt",
          start_url: "/",
          display: "standalone",
          background_color: "#1E3A5F",
          theme_color: "#E24A4A",
          orientation: "portrait",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "unsplash-images",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
