import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

// For Solana operations
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.91.1";

// For Ethereum operations
import * as ethers from "https://esm.sh/ethers@6.13.5";

// Network endpoints
const NETWORK_ENDPOINTS = {
  ETHEREUM: {
    MAINNET: 'https://ethereum.publicnode.com',
    TESTNET: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public endpoint
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

// Choose which network environment to use
const NETWORK_ENV = 'MAINNET'; // Switched from TESTNET to MAINNET

serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
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

    console.log(`Processing ${operation} for ${blockchain} address ${address}`);

    // Handle different blockchain operations
    switch (operation) {
      case 'getBalance': {
        let balance = 0;
        
        if (blockchain === 'Solana') {
          const connection = new Connection(NETWORK_ENDPOINTS.SOLANA[NETWORK_ENV]);
          const publicKey = new PublicKey(address);
          const rawBalance = await connection.getBalance(publicKey);
          balance = rawBalance / 1_000_000_000; // Convert from lamports to SOL
        } 
        else if (blockchain === 'Ethereum') {
          const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
          const rawBalance = await provider.getBalance(address);
          balance = parseFloat(ethers.formatEther(rawBalance));
        }
        else if (blockchain === 'Bitcoin') {
          const response = await fetch(`${NETWORK_ENDPOINTS.BITCOIN[NETWORK_ENV]}/address/${address}`);
          if (response.ok) {
            const data = await response.json();
            const satoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
            balance = satoshis / 100_000_000; // Convert satoshis to BTC
          }
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
        // This would fetch transaction history from blockchain explorers
        // Implementation depends on which explorer APIs you want to use
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
