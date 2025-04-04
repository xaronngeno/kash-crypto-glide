
// This file serves as a wrapper for bitcoinjs-lib to handle ESM/CommonJS compatibility issues
import * as bitcoinLib from 'bitcoinjs-lib';

// Log the imported library for debugging
console.log('Imported bitcoinLib:', bitcoinLib);

// Create a proper export object
const bitcoin = bitcoinLib;

// Wait for Buffer to be available before allowing bitcoinjs-lib to be used
const ensureBufferAvailable = () => {
  return new Promise((resolve) => {
    const checkBuffer = () => {
      if (typeof globalThis.Buffer !== 'undefined' && 
          typeof globalThis.Buffer.alloc === 'function' && 
          typeof globalThis.Buffer.from === 'function') {
        console.log('Buffer is fully available with required methods');
        resolve(true);
      } else {
        console.log('Buffer not yet fully available, waiting...');
        setTimeout(checkBuffer, 50);
      }
    };
    checkBuffer();
  });
};

// Export an async function to get the bitcoin library when it's safe to use
export const getBitcoin = async () => {
  await ensureBufferAvailable();
  return bitcoin;
};

// Export as named export
export { bitcoin };

// Also provide default export
export default bitcoin;
