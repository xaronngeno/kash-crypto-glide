
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { getBlockchainBalance } from './balance-operations.ts';
import { processEthereumTransaction, processSolanaTransaction } from './transaction-operations.ts';
import { APPLICATION_WALLETS } from './utils.ts';

// Track active operations for proper shutdown handling
const activeOperations = { count: 0 };
let isShuttingDown = false;

addEventListener('beforeunload', (ev) => {
  const reason = ev.detail?.reason || 'unknown reason';
  console.log(`Function shutdown initiated due to: ${reason}`);
  isShuttingDown = true;
  console.log(`Shutdown with ${activeOperations.count} active operations`);
});

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

    const { operation, blockchain, address, amount, recipient, privateKey } = requestData;

    if (!operation || !blockchain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${operation} for ${blockchain} address ${address}`);
    
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
        const balance = await getBlockchainBalance(
          address, 
          blockchain as 'Ethereum' | 'Solana',
          activeOperations
        );
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            balance,
            network: 'MAINNET' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'sendTransaction': {
        // Validate required parameters for transactions
        if (!privateKey || !recipient || !amount || amount <= 0) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Missing required transaction parameters' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          let txResult;
          
          if (blockchain === 'Ethereum') {
            txResult = await processEthereumTransaction(privateKey, recipient, amount);
          } 
          else if (blockchain === 'Solana') {
            txResult = await processSolanaTransaction(privateKey, recipient, amount, address);
          } 
          else {
            throw new Error(`Unsupported blockchain: ${blockchain}`);
          }
          
          // Get application commission wallet address
          const appWalletAddress = blockchain === 'Ethereum' 
            ? APPLICATION_WALLETS.ETHEREUM 
            : APPLICATION_WALLETS.SOLANA;
          
          return new Response(
            JSON.stringify({
              success: true,
              txHash: txResult.txHash,
              originalAmount: amount,
              commissionAmount: txResult.commissionAmount,
              finalAmount: txResult.finalAmount,
              recipient,
              applicationWallet: appWalletAddress
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (txError) {
          console.error(`Error processing ${blockchain} transaction:`, txError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Transaction failed: ${txError instanceof Error ? txError.message : 'Unknown error'}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'getTransactionHistory': {
        const explorerUrls = {
          Ethereum: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&sort=desc`,
          Solana: `https://api.solscan.io/account/transaction?address=${address}&limit=10`
        };
        
        try {
          // This would fetch transaction history from blockchain explorers
          // Implementation depends on which explorer APIs you want to use
          console.log(`Would fetch transaction history from: ${explorerUrls[blockchain as keyof typeof explorerUrls]}`);
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
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
