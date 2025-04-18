import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { ethers } from 'ethers';
import { TronWeb } from '@tronweb3/tronweb';
import { Buffer } from './globalPolyfills';

// Constants for network endpoints
const NETWORK_ENDPOINTS = {
  ETHEREUM: {
    MAINNET: 'https://eth-mainnet.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
    TESTNET: 'https://eth-goerli.g.alchemy.com/v2/92yI5AlUB71NwXg7Qfaf2sclerR5Y2_p',
  },
  SOLANA: {
    MAINNET: 'https://api.mainnet-beta.solana.com',
    TESTNET: clusterApiUrl('devnet'),
  },
  TRON: {
    MAINNET: 'https://api.trongrid.io',
    TESTNET: 'https://api.shasta.trongrid.io',
  }
};

// Set to MAINNET for production use with real balances
export const NETWORK_ENV = 'MAINNET';

// Cache connections to avoid recreating them for every request
let solanaConnectionCache: Connection | null = null;
let ethereumProviderCache: ethers.JsonRpcProvider | null = null;
let tronWebCache: TronWeb | null = null;

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
    
    // Tron connection - use cache if available
    if (!tronWebCache) {
      tronWebCache = new TronWeb({
        fullHost: NETWORK_ENDPOINTS.TRON[NETWORK_ENV],
        headers: { "TRON-PRO-API-KEY": "your-api-key-here" }
      });
    }
    
    return {
      solana: solanaConnectionCache,
      ethereum: ethereumProviderCache,
      tron: tronWebCache,
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
    
    // Get actual balance from blockchain with multiple retries
    const retries = 3;
    let rawBalance = 0;
    
    for (let i = 0; i < retries; i++) {
      try {
        rawBalance = await connection.getBalance(publicKey);
        console.log(`Raw Solana lamports on attempt ${i+1}: ${rawBalance}`);
        break; // Success, exit retry loop
      } catch (err) {
        console.error(`Solana balance fetch attempt ${i+1} failed:`, err);
        if (i === retries - 1) throw err; // Throw on last attempt
        await new Promise(r => setTimeout(r, 1000)); // Wait before retrying
      }
    }
    
    // Convert from lamports to SOL with 12 decimal precision - DO NOT ROUND
    const solBalance = parseFloat((rawBalance / 1_000_000_000).toFixed(12));
    
    // Log all details of the calculation
    console.log(`Solana balance for ${address}: ${solBalance} SOL`, {
      lamports: rawBalance,
      sol: solBalance,
      exactValue: solBalance.toString(),
      stringWith12Decimals: solBalance.toFixed(12),
      calculationType: 'Raw lamports / 10^9',
      isNonZero: solBalance > 0
    });
    
    return solBalance;
  } catch (error) {
    console.error(`Error fetching Solana balance for ${address}:`, error);
    return 0; // Return 0 on error
  }
};

// Fetch balance from Ethereum blockchain with improved error handling
export const fetchEthereumBalance = async (address: string): Promise<number> => {
  try {
    console.log(`Fetching Ethereum balance for ${address} on ${NETWORK_ENV}`);
    const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
    
    // Get actual balance from blockchain
    const rawBalance = await provider.getBalance(address);
    console.log(`Raw Ethereum wei: ${rawBalance.toString()}`);
      
    // Convert from wei to ETH with high precision
    const ethString = ethers.formatEther(rawBalance);
    const ethBalance = parseFloat(parseFloat(ethString).toFixed(12));
    
    // Log all details of the calculation
    console.log(`Ethereum balance for ${address}: ${ethBalance} ETH`, {
      wei: rawBalance.toString(),
      eth: ethBalance,
      exactValue: ethBalance.toString(),
      stringWith12Decimals: ethBalance.toFixed(12),
      calculationType: 'ethers.formatEther(wei)',
      isNonZero: ethBalance > 0
    });
    
    return ethBalance;
  } catch (error) {
    console.error(`Error fetching Ethereum balance for ${address}:`, error);
    return 0; // Return 0 on error
  }
};

// Fetch balance from Tron blockchain with improved error handling
export const fetchTronBalance = async (address: string): Promise<number> => {
  try {
    console.log(`Fetching Tron balance for ${address} on ${NETWORK_ENV}`);
    const tronWeb = new TronWeb({
      fullHost: NETWORK_ENDPOINTS.TRON[NETWORK_ENV],
      headers: { "TRON-PRO-API-KEY": "your-api-key-here" }
    });
    
    // Get actual balance from blockchain
    const balanceInSun = await tronWeb.trx.getBalance(address);
    console.log(`Raw Tron sun: ${balanceInSun}`);
    
    // Convert from sun to TRX with 12 decimal precision
    const trxBalance = parseFloat((balanceInSun / 1_000_000).toFixed(12));
    
    // Log all details of the calculation
    console.log(`Tron balance for ${address}: ${trxBalance} TRX`, {
      sun: balanceInSun,
      trx: trxBalance,
      exactValue: trxBalance.toString(),
      stringWith12Decimals: trxBalance.toFixed(12),
      calculationType: 'Raw sun / 10^6',
      isNonZero: trxBalance > 0
    });
    
    return trxBalance;
  } catch (error) {
    console.error(`Error fetching Tron balance for ${address}:`, error);
    return 0;
  }
};

// Get balance for any supported blockchain address with improved timeout handling
export const getBlockchainBalance = async (
  address: string, 
  blockchain: 'Ethereum' | 'Solana' | 'Tron'
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
            : blockchain === 'Solana'
            ? fetchSolanaBalance(address)
            : fetchTronBalance(address),
          timeout(15000) // 15 second timeout
        ]);
        
        // Ensure result has 12 decimal precision
        const resultWith12Decimals = parseFloat(result.toFixed(12));
        
        // Log results with 12 decimals
        console.log(`${blockchain} balance result with full 12 decimals:`, {
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
    
    // Log final balance with 12 decimals
    console.log(`Final ${blockchain} balance for ${address}:`, {
      value: balance,
      stringValue: balance.toFixed(12),
      hasValue: balance > 0
    });
    
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error);
    return 0;
  }
};

// Add a direct balance check function that bypasses caching
export const forceRefreshBlockchainBalance = async (address: string, blockchain: 'Ethereum' | 'Solana' | 'Tron'): Promise<number> => {
  try {
    console.log(`Force refreshing ${blockchain} balance for ${address}`);
    
    // Use a fresh connection for each force refresh
    if (blockchain === 'Solana') {
      const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV], 'confirmed');
      const publicKey = new PublicKey(address);
      const rawBalance = await connection.getBalance(publicKey);
      const solBalance = parseFloat((rawBalance / 1_000_000_000).toFixed(12));
      
      console.log(`Force refreshed Solana balance: ${solBalance} SOL (${rawBalance} lamports)`);
      return solBalance;
    } else if (blockchain === 'Ethereum') {
      const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
      const rawBalance = await provider.getBalance(address);
      const ethString = ethers.formatEther(rawBalance);
      const ethBalance = parseFloat(parseFloat(ethString).toFixed(12));
      
      console.log(`Force refreshed Ethereum balance: ${ethBalance} ETH (${rawBalance.toString()} wei)`);
      return ethBalance;
    } else {
      const tronWeb = new TronWeb({
        fullHost: NETWORK_ENDPOINTS.TRON[NETWORK_ENV],
        headers: { "TRON-PRO-API-KEY": "your-api-key-here" }
      });
      const balanceInSun = await tronWeb.trx.getBalance(address);
      const trxBalance = parseFloat((balanceInSun / 1_000_000).toFixed(12));
      
      console.log(`Force refreshed Tron balance: ${trxBalance} TRX (${balanceInSun} sun)`);
      return trxBalance;
    }
  } catch (error) {
    console.error(`Error in force refresh of ${blockchain} balance:`, error);
    return 0;
  }
};

// Add a detailed logging function for comprehensive balance reporting
export const reportDetailedBlockchainBalances = async () => {
  const ethereumAddress = '0x73B4B2Ba8C53CBc4aE8a97E4D46250089643adfF';
  const solanaAddress = 'BLfVGCD1MXK4c34CXBexvW8SqRX26yaUikeqxEiffbV2';

  try {
    console.log("Fetching detailed blockchain balances for mainnet...");
    
    const ethereumBalance = await fetchEthereumBalance(ethereumAddress);
    const solanaBalance = await fetchSolanaBalance(solanaAddress);

    console.log("Detailed Blockchain Balances Report:", {
      ethereum: {
        address: ethereumAddress,
        balance: ethereumBalance,
        balanceFormatted: `${ethereumBalance.toFixed(6)} ETH`,
        hasNonZeroBalance: ethereumBalance > 0
      },
      solana: {
        address: solanaAddress,
        balance: solanaBalance,
        balanceFormatted: `${solanaBalance.toFixed(6)} SOL`,
        hasNonZeroBalance: solanaBalance > 0
      }
    });

    return {
      ethereum: ethereumBalance,
      solana: solanaBalance
    };
  } catch (error) {
    console.error("Error retrieving blockchain balances:", error);
    return { ethereum: 0, solana: 0 };
  }
};
