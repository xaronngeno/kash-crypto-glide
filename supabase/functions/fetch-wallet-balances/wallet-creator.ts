
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { generateUserHDWallets } from './utils/hd-wallet-utils.ts';
import { 
  createEthereumWallets, 
  createSolanaWallets, 
  createBitcoinWallet 
} from './utils/wallet-db-ops.ts';

/**
 * Create all required wallets for a new user using HD derivation from a seed phrase
 */
export async function createInitialWallets(supabase: any, userId: string) {
  console.log("Creating wallets directly in fetch-wallet-balances");
  
  try {
    // First check if the user exists in the profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking user profile:", profileError);
    }
    
    // If user profile doesn't exist, create it
    if (!userProfile) {
      console.log("User profile doesn't exist, creating one");
      // Get user info from auth.users if available
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error("Error getting auth user:", authError);
      }
      
      // Create a new profile entry
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser?.user?.email || null,
          numeric_id: Math.floor(Math.random() * 89999999) + 10000000 // Generate a random 8-digit ID
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Failed to create user profile:", insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }
      
      console.log("Created new user profile");
    }
  
    // Generate HD wallets from the seed phrase
    const hdWallets = await generateUserHDWallets(supabase, userId);
    
    const wallets = [];
    
    // Create Ethereum wallet and tokens
    const ethereumWallets = await createEthereumWallets(
      supabase, 
      userId,
      hdWallets.ethereum.address, 
      hdWallets.ethereum.private_key
    );
    wallets.push(...ethereumWallets);
    
    // Create Solana wallet and tokens
    const solanaWallets = await createSolanaWallets(
      supabase, 
      userId,
      hdWallets.solana.address, 
      hdWallets.solana.private_key
    );
    wallets.push(...solanaWallets);
    
    // Create Bitcoin SegWit wallet
    const bitcoinWallet = await createBitcoinWallet(
      supabase, 
      userId,
      hdWallets.bitcoinSegwit.address, 
      hdWallets.bitcoinSegwit.private_key
    );
    wallets.push(bitcoinWallet);
    
    console.log("Created wallets directly with proper HD derivation");
    
    return wallets;
  } catch (error) {
    console.error('Error in wallet creation:', error);
    throw error;
  }
}

/**
 * Create missing wallets for a user that already has some wallets
 */
export async function createMissingWallets(
  supabase: any, 
  userId: string, 
  hasSol: boolean, 
  hasUsdtSol: boolean, 
  hasBtcSegwit: boolean
) {
  console.log("Adding missing wallets");
  const addedWallets = [];
  
  try {
    // First ensure user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking user profile:", profileError);
    }
    
    // If user profile doesn't exist, create it
    if (!userProfile) {
      console.log("User profile doesn't exist, creating one for missing wallets");
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error("Error getting auth user:", authError);
      }
      
      // Create a new profile entry
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser?.user?.email || null,
          numeric_id: Math.floor(Math.random() * 89999999) + 10000000
        });
        
      if (insertError) {
        console.error("Failed to create user profile for missing wallets:", insertError);
        return []; // Return empty array since we can't create wallets without a profile
      }
      
      console.log("Created new user profile for missing wallets");
    }

    // Generate HD wallets to ensure consistent addresses
    const hdWallets = await generateUserHDWallets(supabase, userId);
    
    if (!hasSol || !hasUsdtSol) {
      if (!hasSol) {
        await insertWalletIntoDb(
          supabase, 
          userId, 
          'Solana', 
          'SOL', 
          hdWallets.solana.address, 
          hdWallets.solana.private_key, 
          'imported'
        );
        
        addedWallets.push({
          blockchain: 'Solana',
          currency: 'SOL',
          address: hdWallets.solana.address,
          balance: 0,
          wallet_type: 'imported'
        });
      }
      
      if (!hasUsdtSol) {
        await insertWalletIntoDb(
          supabase, 
          userId, 
          'Solana', 
          'USDT', 
          hdWallets.solana.address, 
          null, 
          'token'
        );
        
        addedWallets.push({
          blockchain: 'Solana',
          currency: 'USDT',
          address: hdWallets.solana.address,
          balance: 0,
          wallet_type: 'token'
        });
      }
    }
    
    if (!hasBtcSegwit) {
      await insertWalletIntoDb(
        supabase, 
        userId, 
        'Bitcoin', 
        'BTC', 
        hdWallets.bitcoinSegwit.address, 
        hdWallets.bitcoinSegwit.private_key, 
        'Native SegWit'
      );
      
      addedWallets.push({
        blockchain: 'Bitcoin',
        currency: 'BTC',
        address: hdWallets.bitcoinSegwit.address,
        balance: 0,
        wallet_type: 'Native SegWit'
      });
    }
    
    return addedWallets;
  } catch (err) {
    console.error("Error creating missing wallets:", err);
    return [];
  }
}

// Helper function to safely insert wallet into database
async function insertWalletIntoDb(
  supabase: any,
  userId: string, 
  blockchain: string, 
  currency: string,
  address: string, 
  privateKey: string | null,
  walletType: string
) {
  try {
    const { error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        blockchain: blockchain,
        currency: currency, 
        address: address,
        private_key: privateKey,
        wallet_type: walletType,
        balance: 0
      });
      
    if (error) {
      console.error(`Error inserting ${blockchain} ${currency} wallet:`, error);
    } else {
      console.log(`Successfully inserted ${blockchain} ${currency} wallet`);
    }
  } catch (err) {
    console.error(`Error in insertWalletIntoDb for ${blockchain} ${currency}:`, err);
  }
}
