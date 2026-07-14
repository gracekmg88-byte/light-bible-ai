import type { CapacitorConfig } from "@capacitor/cli";

// TanStack Start is a server-rendered framework — there is no static
// `index.html` to embed. Capacitor loads the published web app instead.
// The `webDir` still needs a file so `npx cap sync` succeeds; we ship a
// tiny redirect page that also acts as an offline fallback.
const config: CapacitorConfig = {
  appId: "com.biblelumiere.app",
  appName: "Bible Lumière",
  webDir: "dist/client",
  server: {
    url: "https://light-bible-ai.lovable.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#1a1a3e",
      showSpinner: false,
    },
  },
};

export default config;
