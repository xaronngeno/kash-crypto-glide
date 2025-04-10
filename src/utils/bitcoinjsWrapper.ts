
// Import the Buffer polyfill explicitly
import { Buffer } from './globalPolyfills';
import * as bitcoinLib from 'bitcoinjs-lib';

// Create a proper export object
const bitcoin = bitcoinLib;

// Check if Buffer is available and working properly
const isBufferAvailable = () => {
  try {
    if (typeof globalThis.Buffer !== 'function') return false;
    if (typeof globalThis.Buffer.alloc !== 'function') return false;
    if (typeof globalThis.Buffer.from !== 'function') return false;
    
    // Actually test Buffer methods to make sure they work
    const testBuffer = globalThis.Buffer.alloc(1);
    const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
    return true;
  } catch (error) {
    console.error('Buffer test failed:', error);
    return false;
  }
};

// Sleep function for polling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Export an async function to get the bitcoin library when it's safe to use
export const getBitcoin = async () => {
  // Wait for Buffer to be available with timeout
  const startTime = Date.now();
  const timeout = 5000; // 5 second timeout
  
  while (Date.now() - startTime < timeout) {
    if (isBufferAvailable()) {
      console.log('Buffer is fully available for bitcoinjs-lib');
      return bitcoin;
    }
    
    console.log('Waiting for Buffer to be available...');
    // Wait 100ms before checking again
    await sleep(100);
  }
  
  if (!isBufferAvailable()) {
    console.error('Buffer is not fully available for bitcoinjs-lib after timeout');
    throw new Error('Buffer polyfill is not properly loaded after multiple attempts');
  }
  
  return bitcoin;
};

// Export as named export
export { bitcoin };

// Also provide default export
export default bitcoin;
