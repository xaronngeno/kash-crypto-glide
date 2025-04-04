
// This file serves as a wrapper for ecpair to handle ESM/CommonJS compatibility issues
import * as ecpairLib from 'ecpair';

// Export the ECPairFactory function
export const ECPairFactory = ecpairLib.default;

// Also provide default export
export default ecpairLib;
