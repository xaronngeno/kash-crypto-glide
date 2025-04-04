
// This file serves as a wrapper to properly export ECPairFactory
import * as ecpairModule from 'ecpair';

// Re-export the ECPairFactory function
export const ECPairFactory = ecpairModule.default;

// Also provide a default export for modules expecting it
export default ecpairModule;
