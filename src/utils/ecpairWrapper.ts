
// Import Buffer explicitly
import { Buffer } from './globalPolyfills';
import * as ecpairLib from 'ecpair';

// Log the imported library for debugging
console.log('Imported ecpairLib:', ecpairLib);

// Check if Buffer is properly initialized
const isBufferInitialized = () => {
  try {
    // Actually test Buffer methods
    const testBuffer = globalThis.Buffer.alloc(1);
    const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
    return true;
  } catch (error) {
    console.error('Buffer test failed in ecpairWrapper:', error);
    return false;
  }
};

// Ensure we're exporting the correct function
export const ECPairFactory = (ecc: any) => {
  // First ensure Buffer is available
  if (!isBufferInitialized()) {
    throw new Error('Buffer is not properly initialized for ECPair');
  }

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
  const factory = (ecpairLib as any).ECPairFactory || ecpairLib;
  if (typeof factory === 'function') {
    return factory(ecc);
  }
  
  throw new Error('Could not find a valid ECPairFactory function');
};

// Also provide default export
export default ecpairLib;
