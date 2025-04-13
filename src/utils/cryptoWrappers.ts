
// Consolidated crypto library wrappers for Bitcoin, BIP32, and ECPair
import { Buffer } from './globalPolyfills';
import * as bitcoinLib from 'bitcoinjs-lib';
import * as bip32Lib from 'bip32';
import * as ecpairLib from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Export libraries
export const bitcoin = bitcoinLib;
export const bip32 = bip32Lib;

// Check if Buffer is available and working properly
const isBufferAvailable = () => {
  try {
    if (typeof globalThis.Buffer !== 'function') return false;
    if (typeof globalThis.Buffer.alloc !== 'function') return false;
    if (typeof globalThis.Buffer.from !== 'function') return false;
    
    // Test Buffer methods to make sure they work
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

// Async function to get libraries when Buffer is available
export const getCryptoLibs = async () => {
  // Wait for Buffer to be available with timeout
  const startTime = Date.now();
  const timeout = 5000; // 5 second timeout
  
  while (Date.now() - startTime < timeout) {
    if (isBufferAvailable()) {
      console.log('Buffer is fully available for crypto libraries');
      return {
        bitcoin: bitcoinLib,
        bip32: bip32Lib,
        ECPair: ecpairLib.ECPairFactory(ecc)
      };
    }
    
    console.log('Waiting for Buffer to be available...');
    // Wait 100ms before checking again
    await sleep(100);
  }
  
  if (!isBufferAvailable()) {
    console.error('Buffer is not fully available after timeout');
    throw new Error('Buffer polyfill is not properly loaded after multiple attempts');
  }
  
  return {
    bitcoin: bitcoinLib,
    bip32: bip32Lib,
    ECPair: ecpairLib.ECPairFactory(ecc)
  };
};

// ECPair factory export
export const ECPairFactory = (ecc: any) => ecpairLib.ECPairFactory(ecc);

// Default export all libraries for backward compatibility
export default {
  bitcoin: bitcoinLib,
  bip32: bip32Lib,
  ECPair: ecpairLib,
  ecc
};
