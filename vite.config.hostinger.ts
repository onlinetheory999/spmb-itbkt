// Build config khusus untuk hosting statis (Hostinger shared hosting / Node.js).
// Output: dist/ berisi index.html + assets SPA murni (tanpa SSR).
// Jalankan: `bunx vite build --config vite.config.hostinger.ts`
// Upload isi folder `dist/` ke public_html Hostinger.
import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "index.hostinger.html"),
    },
  },
});
