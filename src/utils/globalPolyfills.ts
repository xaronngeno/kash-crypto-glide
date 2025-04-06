
// Import buffer from the node polyfill
import { Buffer } from 'buffer';

console.log("Initializing polyfills...");

// Ensure Buffer is available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}

// Debug log to confirm initialization
console.log("Polyfills initialized. Buffer available:", {
  globalThis: typeof globalThis.Buffer === 'function',
  window: typeof window !== 'undefined' && typeof window.Buffer === 'function'
});

export {};
