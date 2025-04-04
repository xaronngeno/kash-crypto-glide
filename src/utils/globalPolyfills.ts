
// This file provides polyfills for CommonJS modules used in the browser

// Ensure Buffer is properly defined with ALL required methods
if (typeof globalThis.Buffer === 'undefined') {
  console.log('Setting up Buffer polyfill');
  
  // Import the buffer module synchronously to ensure it's available immediately
  import('buffer').then(({ Buffer }) => {
    console.log('Buffer polyfill loaded:', Buffer);
    globalThis.Buffer = Buffer;
    
    // Make Buffer globally available on window for compatibility
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.Buffer = Buffer;
    }
    
    console.log('Buffer.alloc available:', typeof Buffer.alloc === 'function');
    console.log('Buffer.from available:', typeof Buffer.from === 'function');
  });
}

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
