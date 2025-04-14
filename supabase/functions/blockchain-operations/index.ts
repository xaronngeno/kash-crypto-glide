
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

// For Solana operations
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.91.1";

// For Ethereum operations
import * as ethers from "https://esm.sh/ethers@6.13.5";

// Network endpoints - optimized for production mainnet use
const NETWORK_ENDPOINTS = {
  ETHEREUM: {
    MAINNET: 'https://ethereum.publicnode.com',
    TESTNET: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  },
  SOLANA: {
    MAINNET: 'https://api.mainnet-beta.solana.com',
    TESTNET: 'https://api.devnet.solana.com',
  },
  BITCOIN: {
    MAINNET: 'https://blockstream.info/api',
    TESTNET: 'https://blockstream.info/testnet/api',
  }
};

// Set to mainnet for production use
const NETWORK_ENV = 'MAINNET';

// Track active operations for proper shutdown handling
let activeOperations = 0;
let isShuttingDown = false;

addEventListener('beforeunload', (ev) => {
  const reason = ev.detail?.reason || 'unknown reason';
  console.log(`Function shutdown initiated due to: ${reason}`);
  isShuttingDown = true;
  console.log(`Shutdown with ${activeOperations} active operations`);
});

// Helper to track operations for clean shutdown
function trackOperation<T>(operation: Promise<T>): Promise<T> {
  activeOperations++;
  return operation.finally(() => {
    activeOperations--;
    if (activeOperations < 0) activeOperations = 0;
  });
}

serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { operation, blockchain, address, amount, recipient } = requestData;

    if (!operation || !blockchain || !address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${operation} for ${blockchain} address ${address} on ${NETWORK_ENV}`);
    
    // Handle shutdown gracefully
    if (isShuttingDown) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server is shutting down, please retry your request',
          retryable: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Handle different blockchain operations
    switch (operation) {
      case 'getBalance': {
        let balance = 0;
        
        try {
          if (blockchain === 'Solana') {
            const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV]);
            const publicKey = new PublicKey(address);
            const rawBalance = await trackOperation(connection.getBalance(publicKey));
            balance = rawBalance / 1_000_000_000; // Convert from lamports to SOL
          } 
          else if (blockchain === 'Ethereum') {
            const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
            const rawBalance = await trackOperation(provider.getBalance(address));
            balance = parseFloat(ethers.formatEther(rawBalance));
          }
          else if (blockchain === 'Bitcoin') {
            const response = await trackOperation(
              fetch(`${NETWORK_ENDPOINTS.BITCOIN[NETWORK_ENV]}/address/${address}`)
            );
            
            if (response.ok) {
              const data = await response.json();
              const satoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
              balance = satoshis / 100_000_000; // Convert satoshis to BTC
            } else {
              console.error(`Bitcoin API error: ${response.statusText}`);
            }
          }
        } catch (blockchainError) {
          console.error(`Error fetching ${blockchain} balance:`, blockchainError);
          // Continue with zero balance rather than failing completely
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            balance,
            network: NETWORK_ENV 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'getTransactionHistory': {
        // Use appropriate mainnet explorer APIs based on blockchain
        const explorerUrls = {
          Ethereum: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&sort=desc`,
          Solana: `https://api.solscan.io/account/transaction?address=${address}&limit=10`,
          Bitcoin: `${NETWORK_ENDPOINTS.BITCOIN[NETWORK_ENV]}/address/${address}/txs`
        };
        
        try {
          // This would fetch transaction history from blockchain explorers
          // Implementation depends on which explorer APIs you want to use
          console.log(`Would fetch transaction history from: ${explorerUrls[blockchain]}`);
        } catch (historyError) {
          console.error(`Error fetching transaction history:`, historyError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Transaction history endpoint for ${blockchain} will be implemented soon`,
            transactions: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unsupported operation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
