
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
    MAINNET: 'https://bitcoin-mainnet.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
    TESTNET: 'https://bitcoin-testnet.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
  }
};

// Network environment setting - change to 'MAINNET' for production use
export const NETWORK_ENV = 'TESTNET'; // Default to testnet for safety

// Initialize blockchain connections
export const initializeBlockchainConnections = () => {
  try {
    // Solana connection
    const solanaConnection = new Connection(
      NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV],
      'confirmed'
    );
    
    // Ethereum provider
    const ethereumProvider = new ethers.JsonRpcProvider(
      NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]
    );
    
    return {
      solana: solanaConnection,
      ethereum: ethereumProvider,
    };
  } catch (error) {
    console.error('Error initializing blockchain connections:', error);
    throw error;
  }
};

// Fetch balance from Solana blockchain
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

// Fetch balance from Ethereum blockchain
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

// Fetch balance from Bitcoin blockchain
export const fetchBitcoinBalance = async (address: string): Promise<number> => {
  try {
    // Use a public Bitcoin API for balance lookups
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

// Get balance for any supported blockchain address
export const getBlockchainBalance = async (
  address: string, 
  blockchain: 'Ethereum' | 'Solana' | 'Bitcoin'
): Promise<number> => {
  try {
    console.log(`Fetching ${blockchain} balance for ${address} on ${NETWORK_ENV}`);
    
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
  } catch (error) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error);
    return 0;
  }
};
