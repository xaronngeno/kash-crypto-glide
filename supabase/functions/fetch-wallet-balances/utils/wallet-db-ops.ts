
import { insertWalletIntoDb } from './wallet-insert.ts';

/**
 * Insert Ethereum wallet and token into database
 */
export async function createEthereumWallets(
  supabase: any, 
  userId: string,
  address: string,
  privateKey: string
) {
  try {
    // Create Ethereum wallet and tokens
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'ETH', 
      address, 
      privateKey, 
      'imported'
    );
    
    const ethWallet = {
      blockchain: 'Ethereum',
      currency: 'ETH',
      address: address,
      balance: 0,
      wallet_type: 'imported'
    };
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Ethereum', 
      'USDT', 
      address, 
      null, 
      'token'
    );
    
    const usdtWallet = {
      blockchain: 'Ethereum',
      currency: 'USDT',
      address: address,
      balance: 0,
      wallet_type: 'token'
    };
    
    return [ethWallet, usdtWallet];
  } catch (error) {
    console.error("Error creating Ethereum wallets:", error);
    return [];
  }
}

/**
 * Insert Solana wallet and token into database
 */
export async function createSolanaWallets(
  supabase: any, 
  userId: string,
  address: string,
  privateKey: string
) {
  try {
    // Create Solana wallet and tokens
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'SOL', 
      address, 
      privateKey, 
      'imported'
    );
    
    const solWallet = {
      blockchain: 'Solana',
      currency: 'SOL',
      address: address,
      balance: 0,
      wallet_type: 'imported'
    };
    
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Solana', 
      'USDT', 
      address, 
      null, 
      'token'
    );
    
    const usdtSolWallet = {
      blockchain: 'Solana',
      currency: 'USDT',
      address: address,
      balance: 0,
      wallet_type: 'token'
    };
    
    return [solWallet, usdtSolWallet];
  } catch (error) {
    console.error("Error creating Solana wallets:", error);
    return [];
  }
}

/**
 * Insert Bitcoin SegWit wallet into database
 */
export async function createBitcoinWallet(
  supabase: any, 
  userId: string,
  address: string,
  privateKey: string
) {
  try {
    // Create Bitcoin SegWit wallet
    await insertWalletIntoDb(
      supabase, 
      userId, 
      'Bitcoin', 
      'BTC', 
      address, 
      privateKey, 
      'Native SegWit'
    );
    
    return {
      blockchain: 'Bitcoin',
      currency: 'BTC',
      address: address,
      balance: 0,
      wallet_type: 'Native SegWit'
    };
  } catch (error) {
    console.error("Error creating Bitcoin wallet:", error);
    throw error;
  }
}
