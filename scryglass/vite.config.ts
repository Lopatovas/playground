import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist/seat",
    emptyOutDir: true,
  },
  server: {
    middlewareMode: true,
  },
});
