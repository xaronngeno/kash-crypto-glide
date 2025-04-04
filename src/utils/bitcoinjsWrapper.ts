
// This file serves as a wrapper for bitcoinjs-lib to handle ESM/CommonJS compatibility issues
import * as bitcoinLib from 'bitcoinjs-lib';

// Log the imported library for debugging
console.log('Imported bitcoinLib:', bitcoinLib);

// Create a proper export object
const bitcoin = bitcoinLib;

// Check if Buffer is available
const isBufferAvailable = () => {
  return (
    typeof globalThis.Buffer !== 'undefined' &&
    typeof globalThis.Buffer.alloc === 'function' &&
    typeof globalThis.Buffer.from === 'function'
  );
};

// Export an async function to get the bitcoin library when it's safe to use
export const getBitcoin = () => {
  if (!isBufferAvailable()) {
    console.error('Buffer is not fully available for bitcoinjs-lib');
    throw new Error('Buffer polyfill is not properly loaded');
  }
  
  return bitcoin;
};

// Export as named export
export { bitcoin };

// Also provide default export
export default bitcoin;
