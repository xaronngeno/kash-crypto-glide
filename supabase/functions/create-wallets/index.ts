
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { Keypair } from 'https://esm.sh/@solana/web3.js@1.91.1';
import { ethers } from 'https://esm.sh/ethers@6.13.5';

// Supabase client setup with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string;
  walletType?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID from request
    let userId;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      // If called with auth token, verify the user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      
      userId = user.id;
    } else {
      // For direct invocation (initial signup), extract from body
      const { userId: bodyUserId } = await req.json();
      
      if (!bodyUserId) {
        throw new Error('User ID is required');
      }
      
      userId = bodyUserId;
    }
    
    // First check if wallets already exist for this user
    const { data: existingWallets, error: checkError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    // If wallets already exist, return early
    if (existingWallets && existingWallets.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Wallets already exist for this user',
          wallets: existingWallets 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate wallets
    console.log(`Generating wallets for user: ${userId}`);
    const wallets = await generateWalletsForUser(userId);
    
    // Store wallets in database
    const { data: insertedWallets, error: insertError } = await supabase
      .from('wallets')
      .insert(wallets.map(wallet => ({
        user_id: userId,
        blockchain: wallet.blockchain,
        currency: wallet.platform === wallet.blockchain ? wallet.blockchain : wallet.platform,
        address: wallet.address,
        wallet_type: wallet.walletType,
        // We don't store private keys in the database for security
      })))
      .select();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`Successfully created ${insertedWallets.length} wallets for user: ${userId}`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Wallets created successfully',
        wallets: insertedWallets 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error creating wallets:`, error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Function to generate all crypto wallets
async function generateWalletsForUser(userId: string): Promise<WalletData[]> {
  const wallets: WalletData[] = [];
  
  try {
    // Generate Solana wallet
    const solanaKeypair = Keypair.generate();
    wallets.push({
      blockchain: 'Solana',
      platform: 'Solana',
      address: solanaKeypair.publicKey.toString(),
      // Only temporarily available, not stored in DB
      privateKey: Array.from(solanaKeypair.secretKey).toString(),
    });
    
    // Generate Ethereum wallet
    const ethWallet = ethers.Wallet.createRandom();
    wallets.push({
      blockchain: 'Ethereum',
      platform: 'Ethereum',
      address: ethWallet.address,
      // Only temporarily available, not stored in DB
      privateKey: ethWallet.privateKey,
    });
    
    // Generate other Ethereum-compatible wallets (same format, different blockchain category)
    wallets.push({
      blockchain: 'Polygon',
      platform: 'Polygon',
      address: ethWallet.address, // Same address as ETH
      privateKey: ethWallet.privateKey, // Same key as ETH
    });
    
    wallets.push({
      blockchain: 'Base',
      platform: 'Base',
      address: ethWallet.address, // Same address as ETH
      privateKey: ethWallet.privateKey, // Same key as ETH
    });
    
    // Add more wallets as needed for other chains
    
    // Note: Bitcoin and TRX wallets would be added here with proper libraries
    // For now, we're simplifying to focus on the flow
    
    return wallets;
  } catch (error) {
    console.error('Error generating wallets:', error);
    throw new Error(`Failed to generate wallets: ${error.message || String(error)}`);
  }
}
