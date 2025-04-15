
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.91.1";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { NETWORK_ENDPOINTS, NETWORK_ENV, trackOperation } from './utils.ts';

// Get Solana balance for an address
export async function getSolanaBalance(
  address: string, 
  activeOperations: { count: number }
): Promise<number> {
  try {
    console.log(`Fetching Solana balance for ${address} on ${NETWORK_ENV}`);
    const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV]);
    const publicKey = new PublicKey(address);
    const rawBalance = await trackOperation(connection.getBalance(publicKey), activeOperations);
    const balance = rawBalance / 1_000_000_000; // Convert from lamports to SOL
    console.log(`Retrieved Solana balance: ${balance} SOL`);
    return balance;
  } catch (error) {
    console.error(`Error fetching Solana balance:`, error);
    return 0;
  }
}

// Get Ethereum balance for an address
export async function getEthereumBalance(
  address: string, 
  activeOperations: { count: number }
): Promise<number> {
  try {
    console.log(`Fetching Ethereum balance for ${address} on ${NETWORK_ENV}`);
    const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
    const rawBalance = await trackOperation(provider.getBalance(address), activeOperations);
    const balance = parseFloat(ethers.formatEther(rawBalance));
    console.log(`Retrieved Ethereum balance: ${balance} ETH`);
    return balance;
  } catch (error) {
    console.error(`Error fetching Ethereum balance:`, error);
    return 0;
  }
}

// Get balance with timeout handling
export async function getBlockchainBalance(
  address: string, 
  blockchain: 'Ethereum' | 'Solana',
  activeOperations: { count: number }
): Promise<number> {
  // Create a promise that rejects after timeout
  const timeout = (ms: number): Promise<never> => {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    );
  };

  try {
    console.log(`Fetching ${blockchain} balance for ${address} on ${NETWORK_ENV}`);
    
    // Execute balance fetch with timeout (15 seconds)
    const fetchWithTimeout = async (): Promise<number> => {
      try {
        const result = await Promise.race([
          blockchain === 'Ethereum' 
            ? getEthereumBalance(address, activeOperations) 
            : getSolanaBalance(address, activeOperations),
          timeout(15000) // 15 second timeout
        ]);
        
        return result;
      } catch (error) {
        if ((error as Error).message?.includes('timed out')) {
          console.error(`Timeout fetching ${blockchain} balance for ${address}`);
        }
        throw error;
      }
    };
    
    return await fetchWithTimeout();
  } catch (error) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error);
    return 0;
  }
}
