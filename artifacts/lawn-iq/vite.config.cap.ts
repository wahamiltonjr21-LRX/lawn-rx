/**
 * Vite config for Capacitor / app-store builds.
 *
 * Differences from the normal dev config:
 *  - No PORT / BASE_PATH env-var requirements (not needed for static builds)
 *  - base is always "/"  (Capacitor serves files from the device filesystem)
 *  - No Replit-specific dev plugins
 *  - VITE_API_BASE is injected so all fetch calls target the live API server
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify(
      "https://lawn-rx.replit.app",
    ),
  },
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
