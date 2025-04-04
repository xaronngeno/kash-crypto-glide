
// This file serves as a wrapper for ecpair to handle ESM/CommonJS compatibility issues
import * as ecpairLib from 'ecpair';

// Log the imported library for debugging
console.log('Imported ecpairLib:', ecpairLib);

// Export the ECPairFactory function
export const ECPairFactory = ecpairLib.default;

// Also provide default export
export default ecpairLib;
