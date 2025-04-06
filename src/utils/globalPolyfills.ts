
// Import buffer from the node polyfill
import { Buffer as NodeBuffer } from 'buffer';

console.log("Initializing polyfills...");

// Export Buffer for direct imports
export const Buffer = NodeBuffer;

// Ensure Buffer is available globally
if (typeof window !== 'undefined') {
  window.Buffer = NodeBuffer;
}

if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = NodeBuffer;
}

// Debug log to confirm initialization
console.log("Polyfills initialized. Buffer available:", {
  globalThis: typeof globalThis.Buffer === 'function',
  window: typeof window !== 'undefined' && typeof window.Buffer === 'function',
  exportedBuffer: typeof Buffer === 'function'
});

// No default export
