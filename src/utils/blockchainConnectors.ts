
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Buffer } from './globalPolyfills';

// Constants for network endpoints
const NETWORK_ENDPOINTS = {
  ETHEREUM: {
    MAINNET: 'https://eth-mainnet.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
    TESTNET: 'https://eth-goerli.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p', // Goerli testnet
  },
  SOLANA: {
    MAINNET: 'https://api.mainnet-beta.solana.com', // Use more reliable endpoint
    TESTNET: clusterApiUrl('devnet'), // Solana devnet for testing
  }
};

// Set to MAINNET for production use with real balances
export const NETWORK_ENV = 'MAINNET';

// Cache connections to avoid recreating them for every request
let solanaConnectionCache: Connection | null = null;
let ethereumProviderCache: ethers.JsonRpcProvider | null = null;

// Initialize blockchain connections with caching
export const initializeBlockchainConnections = () => {
  try {
    // Solana connection - use cache if available
    if (!solanaConnectionCache) {
      solanaConnectionCache = new Connection(
        NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV],
        'confirmed'
      );
    }
    
    // Ethereum provider - use cache if available
    if (!ethereumProviderCache) {
      ethereumProviderCache = new ethers.JsonRpcProvider(
        NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]
      );
    }
    
    return {
      solana: solanaConnectionCache,
      ethereum: ethereumProviderCache,
    };
  } catch (error) {
    console.error('Error initializing blockchain connections:', error);
    throw error;
  }
};

// Fetch balance from Solana blockchain with improved error handling
export const fetchSolanaBalance = async (address: string): Promise<number> => {
  try {
    console.log(`Fetching Solana balance for ${address} on ${NETWORK_ENV}`);
    const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV], 'confirmed');
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    
    // Convert from lamports to SOL with 12 decimal precision - DO NOT ROUND
    const solBalance = parseFloat((balance / 1_000_000_000).toFixed(12));
    
    // Log all details of the calculation
    console.log(`Solana balance for ${address}: ${solBalance} SOL`, {
      lamports: balance,
      sol: solBalance,
      exactValue: solBalance.toString(),
      stringWith12Decimals: solBalance.toFixed(12),
      calculationType: 'Raw lamports / 10^9',
      isNonZero: solBalance > 0
    });
    
    return solBalance;
  } catch (error) {
    console.error(`Error fetching Solana balance for ${address}:`, error);
    return 0;
  }
};

// Fetch balance from Ethereum blockchain with improved error handling
export const fetchEthereumBalance = async (address: string): Promise<number> => {
  try {
    console.log(`Fetching Ethereum balance for ${address} on ${NETWORK_ENV}`);
    const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
    const balance = await provider.getBalance(address);
    
    // Convert from wei to ETH with high precision
    const ethString = ethers.formatEther(balance);
    const ethBalance = parseFloat(parseFloat(ethString).toFixed(12));
    
    // Log all details of the calculation
    console.log(`Ethereum balance for ${address}: ${ethBalance} ETH`, {
      wei: balance.toString(),
      eth: ethBalance,
      exactValue: ethBalance.toString(),
      stringWith12Decimals: ethBalance.toFixed(12),
      calculationType: 'ethers.formatEther(wei)',
      isNonZero: ethBalance > 0
    });
    
    return ethBalance;
  } catch (error) {
    console.error(`Error fetching Ethereum balance for ${address}:`, error);
    return 0;
  }
};

// Get balance for any supported blockchain address with improved timeout handling
export const getBlockchainBalance = async (
  address: string, 
  blockchain: 'Ethereum' | 'Solana'
): Promise<number> => {
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
            ? fetchEthereumBalance(address) 
            : fetchSolanaBalance(address),
          timeout(15000) // 15 second timeout
        ]);
        
        // Ensure result has 12 decimal precision
        const resultWith12Decimals = parseFloat(result.toFixed(12));
        
        // Log the result with full precision - NEVER ROUND SMALL VALUES
        console.log(`${blockchain} balance result with 12 decimals:`, {
          originalValue: result,
          value12Decimals: resultWith12Decimals,
          stringValue: resultWith12Decimals.toFixed(12),
          hasValue: resultWith12Decimals > 0
        });
        
        return resultWith12Decimals;
      } catch (error) {
        if ((error as Error).message?.includes('timed out')) {
          console.error(`Timeout fetching ${blockchain} balance for ${address}`);
        }
        throw error;
      }
    };
    
    const balance = await fetchWithTimeout();
    console.log(`Final ${blockchain} balance for ${address}:`, {
      value: balance,
      exactString: balance.toFixed(12),
      hasValue: balance > 0
    });
    
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error);
    return 0;
  }
};
