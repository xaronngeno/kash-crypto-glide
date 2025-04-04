
// This file serves as a wrapper for bitcoinjs-lib to handle ESM/CommonJS compatibility issues
import * as bitcoinLib from 'bitcoinjs-lib';

// Log the imported library for debugging
console.log('Imported bitcoinLib:', bitcoinLib);

// Create a proper export object
const bitcoin = bitcoinLib;

// Export as named export
export { bitcoin };

// Also provide default export
export default bitcoin;
