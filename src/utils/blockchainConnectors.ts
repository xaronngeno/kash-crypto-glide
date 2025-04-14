
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
    MAINNET: 'https://solana-mainnet.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
    TESTNET: clusterApiUrl('devnet'), // Solana devnet for testing
  },
  BITCOIN: {
    MAINNET: 'https://blockstream.info/api',
    TESTNET: 'https://blockstream.info/testnet/api',
  }
};

// Network environment setting - mainnet configuration
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
    const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV], 'confirmed');
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    // Convert from lamports to SOL
    return balance / 1_000_000_000;
  } catch (error) {
    console.error(`Error fetching Solana balance for ${address}:`, error);
    return 0;
  }
};

// Fetch balance from Ethereum blockchain with improved error handling
export const fetchEthereumBalance = async (address: string): Promise<number> => {
  try {
    const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
    const balance = await provider.getBalance(address);
    // Convert from wei to ETH
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error(`Error fetching Ethereum balance for ${address}:`, error);
    return 0;
  }
};

// Fetch balance from Bitcoin blockchain with better error handling for mainnet
export const fetchBitcoinBalance = async (address: string): Promise<number> => {
  try {
    // Use blockstream.info API for Bitcoin balance lookups - reliable mainnet service
    const response = await fetch(`${NETWORK_ENDPOINTS.BITCOIN[NETWORK_ENV]}/address/${address}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin balance: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Convert from satoshis to BTC
    const balanceBTC = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100_000_000;
    return balanceBTC;
  } catch (error) {
    console.error(`Error fetching Bitcoin balance for ${address}:`, error);
    return 0;
  }
};

// Get balance for any supported blockchain address with improved timeout handling
export const getBlockchainBalance = async (
  address: string, 
  blockchain: 'Ethereum' | 'Solana' | 'Bitcoin'
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
        const result = Promise.race([
          (async () => {
            switch (blockchain) {
              case 'Ethereum':
                return await fetchEthereumBalance(address);
              case 'Solana':
                return await fetchSolanaBalance(address);
              case 'Bitcoin':
                return await fetchBitcoinBalance(address);
              default:
                console.error(`Unsupported blockchain: ${blockchain}`);
                return 0;
            }
          })(),
          timeout(15000) // 15 second timeout
        ]);
        
        return await result as number;
      } catch (error) {
        if (error.message?.includes('timed out')) {
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
};
