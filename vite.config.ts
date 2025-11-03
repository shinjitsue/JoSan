import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
      },
      output: {
        entryFileNames: "[name].js",
        manualChunks: {
          "vendor-charts": ["recharts"],

          "vendor-ui": [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
