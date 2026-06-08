import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";

// Static site (default output). React islands for the interactive demos.
export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@examples": fileURLToPath(new URL("../examples", import.meta.url)),
      },
    },
    server: {
      fs: {
        // allow importing the shared examples/ + workspace packages from repo root
        allow: [fileURLToPath(new URL("..", import.meta.url))],
      },
    },
  },
});
