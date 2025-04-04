
// Import buffer module directly
import { Buffer as BufferModule } from 'buffer';

// Ensure Buffer is properly defined with ALL required methods
console.log('Setting up Buffer polyfill');

// Make Buffer globally available
globalThis.Buffer = BufferModule;

// Make Buffer available on window for compatibility
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = BufferModule;
}

console.log('Buffer polyfill loaded:', typeof BufferModule);
console.log('Buffer.alloc available:', typeof BufferModule.alloc === 'function');
console.log('Buffer.from available:', typeof BufferModule.from === 'function');

// Ensure global is defined
if (typeof globalThis !== 'undefined') {
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

export default {};
