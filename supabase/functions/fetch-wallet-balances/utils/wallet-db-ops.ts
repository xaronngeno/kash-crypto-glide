
import { insertWalletIntoDb } from './wallet-insert.ts';

/**
 * Insert Ethereum wallet into database (without token)
 */
export async function createEthereumWallets(
  supabase: any, 
  userId: string,
  address: string,
  privateKey: string
) {
  try {
    // Create only Ethereum native wallet (no tokens)
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
    
    return [ethWallet];
  } catch (error) {
    console.error("Error creating Ethereum wallets:", error);
    return [];
  }
}

/**
 * Insert Solana wallet into database (without token)
 */
export async function createSolanaWallets(
  supabase: any, 
  userId: string,
  address: string,
  privateKey: string
) {
  try {
    // Create only Solana native wallet (no tokens)
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
    
    return [solWallet];
  } catch (error) {
    console.error("Error creating Solana wallets:", error);
    return [];
  }
}
