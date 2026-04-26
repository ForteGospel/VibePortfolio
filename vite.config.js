import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/VibePortfolio/", // Adjust the base path to match your GitHub Pages repository name
  server: {
    host: true,
    open: "/",
  },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("index.html", import.meta.url)),
        elements: fileURLToPath(new URL("elements.html", import.meta.url)),
      },
    },
  },
});
