
// This file serves as a wrapper for ecpair to handle ESM/CommonJS compatibility issues
import * as ecpairLib from 'ecpair';

// Log the imported library for debugging
console.log('Imported ecpairLib:', ecpairLib);

// Ensure we're exporting the correct function
export const ECPairFactory = (ecc: any) => {
  // First check if it's a default export situation
  if (ecpairLib.default && typeof ecpairLib.default === 'function') {
    console.log('Using default export for ECPairFactory');
    return ecpairLib.default(ecc);
  }
  
  // If not, it might be a named export or the function itself
  if (typeof ecpairLib === 'function') {
    console.log('Using direct function for ECPairFactory');
    return (ecpairLib as any)(ecc);
  }
  
  // Last resort - maybe it's a property
  console.log('Using property for ECPairFactory');
  const factory = ecpairLib.ECPairFactory || ecpairLib;
  if (typeof factory === 'function') {
    return factory(ecc);
  }
  
  throw new Error('Could not find a valid ECPairFactory function');
};

// Also provide default export
export default ecpairLib;
