/**
 * Vite config for Capacitor / app-store builds.
 *
 * Differences from the normal dev config:
 *  - No PORT / BASE_PATH env-var requirements (not needed for static builds)
 *  - base is always "/"  (Capacitor serves files from the device filesystem)
 *  - No Replit-specific dev plugins
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
