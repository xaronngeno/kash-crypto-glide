// Import Buffer explicitly
import { Buffer } from './globalPolyfills';
import * as ecpairLib from 'ecpair';

// Log the imported library for debugging
console.log('Imported ecpairLib:', ecpairLib);

// Check if Buffer is properly initialized
const isBufferInitialized = () => {
  try {
    if (typeof globalThis.Buffer !== 'function') return false;
    if (typeof globalThis.Buffer.alloc !== 'function') return false;
    if (typeof globalThis.Buffer.from !== 'function') return false;
    
    // Actually test Buffer methods
    const testBuffer = globalThis.Buffer.alloc(1);
    const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
    return true;
  } catch (error) {
    console.error('Buffer test failed in ecpairWrapper:', error);
    return false;
  }
};

// Sleep function for polling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Async function to get ECPair when it's safe to use
export const getECPairFactory = async (ecc: any) => {
  // Wait for Buffer to be available with timeout
  const startTime = Date.now();
  const timeout = 5000; // 5 second timeout
  
  while (Date.now() - startTime < timeout) {
    if (isBufferInitialized()) {
      // Return the factory directly
      return ecpairLib.ECPairFactory(ecc);
    }
    
    console.log('Waiting for Buffer to be available for ECPair...');
    await sleep(100);
  }
  
  throw new Error('Buffer is not properly initialized for ECPair after timeout');
};

// Keep original synchronous version for backward compatibility
export const ECPairFactory = (ecc: any) => {
  // First ensure Buffer is available
  if (!isBufferInitialized()) {
    throw new Error('Buffer is not properly initialized for ECPair');
  }

  // Return the factory directly
  return ecpairLib.ECPairFactory(ecc);
};

// Also provide default export
export default ecpairLib;
