import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      // Multi-page build: the main prototype plus the standalone summary
      // discovery pages, so `dist/` ships all three as static files.
      input: {
        main: resolve(__dirname, "index.html"),
        summaryDiscovery: resolve(__dirname, "summary-discovery.html"),
        summaryTry: resolve(__dirname, "summary-try.html"),
      },
    },
  },
});
