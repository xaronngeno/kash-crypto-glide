
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
    exclude: ['@mysten/sui.js'],
    esbuildOptions: {
      target: 'esnext', // Needed for WebAssembly support
    },
    include: ['bs58', 'tweetnacl', 'bitcoinjs-lib', 'ecpair', 'tiny-secp256k1', 'buffer', 'bip32'] // Pre-bundle these packages
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
    // Add Node.js polyfills
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add aliases for packages to ensure they're properly imported
      'bs58': path.resolve(__dirname, 'node_modules/bs58'),
      'tweetnacl': path.resolve(__dirname, 'node_modules/tweetnacl'),
      'ecpair': path.resolve(__dirname, 'node_modules/ecpair'),
      'bitcoinjs-lib': path.resolve(__dirname, 'node_modules/bitcoinjs-lib'),
      'buffer': path.resolve(__dirname, 'node_modules/buffer'),
      'bip32': path.resolve(__dirname, 'node_modules/bip32'),
    },
    dedupe: ['bs58', 'tweetnacl', 'buffer', 'bip32'], // Deduplicate packages to use a single instance
  },
  define: {
    // Add global definitions to help with CommonJS modules
    'process.env': {},
    'global': 'globalThis',
  },
}));
