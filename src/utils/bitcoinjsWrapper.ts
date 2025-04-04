
// This file serves as a wrapper to properly export bitcoinjs-lib
import * as bitcoinjsLib from 'bitcoinjs-lib';

// Re-export everything
export const bitcoin = bitcoinjsLib;

// Also provide a default export for modules expecting it
export default bitcoinjsLib;
