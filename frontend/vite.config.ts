import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@devle/engine": path.resolve(import.meta.dirname, "../packages/engine/src/index.ts"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/health": "http://localhost:4000",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
