
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Disable error overlay
    },
  },
  optimizeDeps: {
    // Tell Vite to exclude certain dependencies from optimization
    exclude: ['@mysten/sui.js', 'tiny-secp256k1', 'bitcoinjs-lib', 'ecpair'],
    esbuildOptions: {
      target: 'esnext', // Needed for WebAssembly support
    }
  },
  build: {
    target: 'esnext', // Needed for WebAssembly support
  },
  plugins: [
    // Ensure wasm and topLevelAwait plugins are ordered first
    wasm(),
    topLevelAwait(),
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
