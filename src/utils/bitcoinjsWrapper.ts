
// Import the Buffer polyfill explicitly
import { Buffer } from './globalPolyfills';
import * as bitcoinLib from 'bitcoinjs-lib';

// Log the imported library for debugging
console.log('Imported bitcoinLib:', bitcoinLib);

// Create a proper export object
const bitcoin = bitcoinLib;

// Check if Buffer is available and working properly
const isBufferAvailable = () => {
  try {
    // Actually test Buffer methods to make sure they work
    const testBuffer = globalThis.Buffer.alloc(1);
    const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
    return true;
  } catch (error) {
    console.error('Buffer test failed:', error);
    return false;
  }
};

// Export an async function to get the bitcoin library when it's safe to use
export const getBitcoin = async () => {
  // Wait for Buffer to be available
  for (let i = 0; i < 10; i++) { // Try up to 10 times
    if (isBufferAvailable()) {
      return bitcoin;
    }
    
    console.log(`Waiting for Buffer to be available (attempt ${i + 1})...`);
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!isBufferAvailable()) {
    console.error('Buffer is not fully available for bitcoinjs-lib after multiple attempts');
    throw new Error('Buffer polyfill is not properly loaded after multiple attempts');
  }
  
  return bitcoin;
};

// Export as named export
export { bitcoin };

// Also provide default export
export default bitcoin;
