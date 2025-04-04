
// Import buffer module directly
import { Buffer as BufferPolyfill } from 'buffer';

console.log('Setting up Buffer polyfill');

// Make Buffer globally available with all methods intact
if (typeof globalThis !== 'undefined') {
  // Ensure Buffer is properly defined with all its methods
  globalThis.Buffer = BufferPolyfill;
  
  // Log Buffer initialization success
  console.log('Buffer polyfill loaded:', typeof globalThis.Buffer);
  console.log('Buffer.alloc available:', typeof globalThis.Buffer.alloc === 'function');
  console.log('Buffer.from available:', typeof globalThis.Buffer.from === 'function');
  
  // Make Buffer available on window for compatibility
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.Buffer = BufferPolyfill;
  }
}

// Ensure global is defined
if (typeof window !== 'undefined' && typeof globalThis !== 'undefined') {
  // @ts-ignore
  window.global = globalThis;
}

// Ensure process and process.env are defined
if (typeof process === 'undefined') {
  // @ts-ignore
  window.process = { env: {} };
} else if (typeof process.env === 'undefined') {
  // @ts-ignore
  process.env = {};
}

// Export the Buffer class to be used elsewhere if needed
export { BufferPolyfill as Buffer };
export default {};
