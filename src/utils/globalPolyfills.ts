
// This file provides polyfills for CommonJS modules used in the browser

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

// Required for ecpair and bitcoinjs-lib
if (typeof globalThis.Buffer === 'undefined') {
  console.log('Buffer polyfill applied');
  // @ts-ignore - Dynamically importing the buffer module
  import('buffer').then(Buffer => {
    // @ts-ignore
    window.Buffer = Buffer.Buffer;
    globalThis.Buffer = Buffer.Buffer;
  });
}

export default {};
