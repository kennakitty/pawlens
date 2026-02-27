import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In development, any request to /api gets forwarded to the Express server
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
