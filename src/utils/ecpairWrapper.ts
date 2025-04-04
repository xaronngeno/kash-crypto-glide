
// This file serves as a wrapper to properly export ECPairFactory
import * as ecpairLib from 'ecpair';

// Re-export the ECPairFactory function
export const ECPairFactory = ecpairLib.default;

// Also provide a default export for modules expecting it
export default ecpairLib;
