import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lawnrx.app",
  appName: "LawnRX",
  webDir: "dist/public",
  server: {
    /**
     * Point at your live deployed URL so auth, the API, and sessions all
     * work correctly through the real server.  Replace this with the actual
     * domain once your app is published on Replit.
     *
     * Example: "https://lawnrx.replit.app"
     *
     * For a fully offline / local-files build, remove the `server` block and
     * set BASE_URL in your app to point at the deployed API.
     */
    url: process.env.CAPACITOR_SERVER_URL ?? "https://lawnrx.replit.app",
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
  ios: {
    scheme: "LawnRX",
  },
};

export default config;
