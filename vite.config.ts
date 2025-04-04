
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
    },
    include: ['bs58', 'tweetnacl'] // Ensure bs58 and tweetnacl are pre-bundled correctly
  },
  build: {
    target: 'esnext', // Needed for WebAssembly support
    commonjsOptions: {
      transformMixedEsModules: true, // Handle mixed ES modules and CommonJS
    }
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
      // Add an alias for bs58 to ensure it's properly imported
      'bs58': path.resolve(__dirname, 'node_modules/bs58'),
      // Add an alias for tweetnacl
      'tweetnacl': path.resolve(__dirname, 'node_modules/tweetnacl'),
      // Add an alias for ecpair
      'ecpair': path.resolve(__dirname, 'node_modules/ecpair'),
      // Add an alias for bitcoinjs-lib
      'bitcoinjs-lib': path.resolve(__dirname, 'node_modules/bitcoinjs-lib')
    },
    dedupe: ['bs58', 'tweetnacl'] // Deduplicate bs58 and tweetnacl to use a single instance
  },
}));
