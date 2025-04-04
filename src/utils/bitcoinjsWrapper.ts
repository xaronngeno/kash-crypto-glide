
// This file serves as a wrapper to properly export bitcoinjs-lib for ESM compatibility
import * as bitcoin from 'bitcoinjs-lib';

// Export a simple object with all the bitcoinjs-lib exports
export { bitcoin };

// Also provide a default export
export default bitcoin;
