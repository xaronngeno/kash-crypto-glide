
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { 
  createEthereumWallet,
  createSolanaWallet,
  createBitcoinSegWitWallet,
  insertWalletIntoDb,
  getOrCreateSeedPhrase,
  generateHDWallets
} from '../_shared/wallet-helpers.ts';

// Create all required wallets for a new user
export async function createInitialWallets(supabase: any, userId: string) {
  console.log("Creating wallets directly in fetch-wallet-balances");
  
  try {
    // Get or create a seed phrase for the user
    const seedPhrase = await getOrCreateSeedPhrase(supabase, userId);
    console.log("Got seed phrase for user");
    
    // Generate HD wallets from the seed phrase
    const hdWallets = await generateHDWallets(seedPhrase, userId);
    
    const wallets = [];
    
    // Create Ethereum wallet and tokens
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'ETH', 
      hdWallets.ethereum.address, 
      hdWallets.ethereum.private_key, 
      'imported'
    );
    
    wallets.push({
      blockchain: 'Ethereum',
      currency: 'ETH',
      address: hdWallets.ethereum.address,
      balance: 0,
      wallet_type: 'imported'
    });
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'USDT', 
      hdWallets.ethereum.address, 
      null, 
      'token'
    );
    
    wallets.push({
      blockchain: 'Ethereum',
      currency: 'USDT',
      address: hdWallets.ethereum.address,
      balance: 0,
      wallet_type: 'token'
    });
    
    // Create Solana wallet and tokens
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'SOL', 
      hdWallets.solana.address, 
      hdWallets.solana.private_key, 
      'imported'
    );
    
    wallets.push({
      blockchain: 'Solana',
      currency: 'SOL',
      address: hdWallets.solana.address,
      balance: 0,
      wallet_type: 'imported'
    });
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'USDT', 
      hdWallets.solana.address, 
      null, 
      'token'
    );
    
    wallets.push({
      blockchain: 'Solana',
      currency: 'USDT',
      address: hdWallets.solana.address,
      balance: 0,
      wallet_type: 'token'
    });
    
    // Create Bitcoin SegWit wallet
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Bitcoin', 
      'BTC', 
      hdWallets.bitcoinSegwit.address, 
      hdWallets.bitcoinSegwit.private_key, 
      'Native SegWit'
    );
    
    wallets.push({
      blockchain: 'Bitcoin',
      currency: 'BTC',
      address: hdWallets.bitcoinSegwit.address,
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
    // Get the seed phrase to generate consistent wallets
    const seedPhrase = await getOrCreateSeedPhrase(supabase, userId);
    const hdWallets = await generateHDWallets(seedPhrase, userId);
    
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
