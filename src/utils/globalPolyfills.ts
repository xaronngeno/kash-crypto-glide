
// Import buffer module directly
import { Buffer as BufferPolyfill } from 'buffer';

console.log('Setting up Buffer polyfill');

// Make sure we're assigning the complete Buffer object with all methods
const BufferClass = BufferPolyfill;

// Verify that the required methods exist
if (typeof BufferClass.alloc !== 'function') {
  console.error('BufferPolyfill.alloc is not available!', BufferClass);
  throw new Error('Buffer polyfill is incomplete - alloc method missing');
}

if (typeof BufferClass.from !== 'function') {
  console.error('BufferPolyfill.from is not available!', BufferClass);
  throw new Error('Buffer polyfill is incomplete - from method missing');
}

// Make Buffer globally available with all methods intact
globalThis.Buffer = BufferClass;

// Make Buffer available on window for compatibility
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = BufferClass;
}

console.log('Buffer polyfill loaded successfully:', typeof BufferClass);
console.log('Buffer.alloc available:', typeof BufferClass.alloc === 'function');
console.log('Buffer.from available:', typeof BufferClass.from === 'function');

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

// Export the Buffer class to be used elsewhere if needed
export { BufferClass as Buffer };
export default {};
