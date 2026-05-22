/**
 * Vite config for TEST / internal-only Capacitor builds.
 * Identical to vite.config.cap.ts but with VITE_TEST_BUILD=true
 * which bypasses the free-analysis-limit UI in the app.
 * DO NOT use this config for production App Store builds.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify("https://lawn-rx.replit.app"),
    "import.meta.env.VITE_TEST_BUILD": JSON.stringify("true"),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
