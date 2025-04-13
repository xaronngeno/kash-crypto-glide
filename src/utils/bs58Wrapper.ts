
// This file serves as a wrapper to properly export bs58
import * as bs58Module from 'bs58';

// Re-export everything
export const bs58 = bs58Module;

// Also provide named exports for common functions
export const encode = bs58Module.encode;
export const decode = bs58Module.decode;

// Also provide a default export for modules expecting it
export default bs58Module;
