import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  root: path.resolve(import.meta.dirname, "."),
  resolve: {
    alias: {
      "@void-market/shared": path.resolve(import.meta.dirname, "../shared/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:2567",
        changeOrigin: true,
      },
      "/colyseus": {
        target: "ws://localhost:2567",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
