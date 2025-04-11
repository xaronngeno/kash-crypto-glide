
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { 
  createEthereumWallet,
  createSolanaWallet,
  createBitcoinSegWitWallet,
  insertWalletIntoDb
} from '../_shared/wallet-helpers.ts';

// Create all required wallets for a new user
export async function createInitialWallets(supabase: any, userId: string) {
  console.log("Creating wallets directly in fetch-wallet-balances");
  
  try {
    const wallets = [];
    
    // Create Ethereum wallet and tokens
    const ethWallet = await createEthereumWallet(userId);
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'ETH', 
      ethWallet.address, 
      ethWallet.private_key, 
      'imported'
    );
    
    wallets.push({
      blockchain: 'Ethereum',
      currency: 'ETH',
      address: ethWallet.address,
      balance: 0,
      wallet_type: 'imported'
    });
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'USDT', 
      ethWallet.address, 
      null, 
      'token'
    );
    
    wallets.push({
      blockchain: 'Ethereum',
      currency: 'USDT',
      address: ethWallet.address,
      balance: 0,
      wallet_type: 'token'
    });
    
    // Create Solana wallet and tokens
    const solWallet = await createSolanaWallet(userId);
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'SOL', 
      solWallet.address, 
      solWallet.private_key, 
      'imported'
    );
    
    wallets.push({
      blockchain: 'Solana',
      currency: 'SOL',
      address: solWallet.address,
      balance: 0,
      wallet_type: 'imported'
    });
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'USDT', 
      solWallet.address, 
      null, 
      'token'
    );
    
    wallets.push({
      blockchain: 'Solana',
      currency: 'USDT',
      address: solWallet.address,
      balance: 0,
      wallet_type: 'token'
    });
    
    // Create Bitcoin SegWit wallet
    const btcWallet = await createBitcoinSegWitWallet(userId);
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Bitcoin', 
      'BTC', 
      btcWallet.address, 
      btcWallet.private_key, 
      'Native SegWit'
    );
    
    wallets.push({
      blockchain: 'Bitcoin',
      currency: 'BTC',
      address: btcWallet.address,
      balance: 0,
      wallet_type: 'Native SegWit'
    });
    
    console.log("Created wallets directly");
    
    return wallets;
  } catch (error) {
    console.error('Error in wallet creation:', error);
    throw error;
  }
}

// Create missing wallets for a user that already has some wallets
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
    if (!hasSol || !hasUsdtSol) {
      const solWallet = await createSolanaWallet(userId);
      
      if (!hasSol) {
        await insertWalletIntoDb(
          supabase, 
          userId, 
          'Solana', 
          'SOL', 
          solWallet.address, 
          solWallet.private_key, 
          'imported'
        );
        
        addedWallets.push({
          blockchain: 'Solana',
          currency: 'SOL',
          address: solWallet.address,
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
          solWallet.address, 
          null, 
          'token'
        );
        
        addedWallets.push({
          blockchain: 'Solana',
          currency: 'USDT',
          address: solWallet.address,
          balance: 0,
          wallet_type: 'token'
        });
      }
    }
    
    if (!hasBtcSegwit) {
      const btcWallet = await createBitcoinSegWitWallet(userId);
      
      await insertWalletIntoDb(
        supabase, 
        userId, 
        'Bitcoin', 
        'BTC', 
        btcWallet.address, 
        btcWallet.private_key, 
        'Native SegWit'
      );
      
      addedWallets.push({
        blockchain: 'Bitcoin',
        currency: 'BTC',
        address: btcWallet.address,
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
