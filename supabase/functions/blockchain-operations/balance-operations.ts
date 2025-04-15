
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
    
    // Fetch raw balance from blockchain
    const rawBalance = await trackOperation(connection.getBalance(publicKey), activeOperations);
    
    // Convert from lamports to SOL with high precision - DO NOT ROUND OR LOSE PRECISION
    const balance = parseFloat((rawBalance / 1_000_000_000).toFixed(12)); 
    
    // Log every detail of the balance calculation
    console.log(`Retrieved Solana balance details:`, {
      address,
      rawLamports: rawBalance,
      convertedSOL: balance,
      stringBalance: balance.toString(),
      calculationType: 'lamports / 10^9',
      isZero: balance === 0,
      isNonZero: balance > 0
    });
    
    return balance; // Return exact value without rounding
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
    
    // Fetch raw balance from blockchain
    const rawBalance = await trackOperation(provider.getBalance(address), activeOperations);
    
    // Convert from wei to ETH with high precision - DO NOT LOSE PRECISION
    const ethString = ethers.formatEther(rawBalance);
    const balance = parseFloat(ethString);
    
    // Log every detail of the balance calculation
    console.log(`Retrieved Ethereum balance details:`, {
      address,
      rawWei: rawBalance.toString(),
      ethString: ethString,
      convertedETH: balance,
      stringBalance: balance.toString(),
      calculationType: 'wei converted to ETH',
      isZero: balance === 0,
      isNonZero: balance > 0
    });
    
    return balance; // Return exact value without rounding
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
        
        // Preserve small balances - don't round or lose precision
        console.log(`${blockchain} balance result (exact value):`, {
          amount: result,
          stringAmount: result.toString(),
          isNonZero: result > 0
        });
        
        return result;
      } catch (error) {
        if ((error as Error).message?.includes('timed out')) {
          console.error(`Timeout fetching ${blockchain} balance for ${address}`);
        }
        throw error;
      }
    };
    
    const balance = await fetchWithTimeout();
    
    // Output exact balance with all decimals
    console.log(`Final ${blockchain} balance for ${address}:`, {
      value: balance,
      stringValue: balance.toString(),
      isNonZero: balance > 0
    });
    
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error);
    return 0;
  }
}
