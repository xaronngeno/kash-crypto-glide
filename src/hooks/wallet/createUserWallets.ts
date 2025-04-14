
import { supabase } from '@/integrations/supabase/client';
import { WalletData } from '@/utils/walletConfig';
import { transformWallet } from './utils/transformWallet';
import { toast } from '@/hooks/use-toast';

// Define allowed blockchains for type checking
const ALLOWED_BLOCKCHAINS = ['Ethereum', 'Solana'];

// Flag to prevent multiple wallet creation attempts
let walletCreationInProgress = false;

/**
 * Validates that wallets are only the supported chains (ETH, SOL)
 */
const validateAllowedWallets = (wallets: any[]): boolean => {
  if (!wallets || wallets.length === 0) return true;
  
  return wallets.every(wallet => 
    ALLOWED_BLOCKCHAINS.includes(wallet.blockchain)
  );
};

/**
 * Creates wallets for a user if they don't exist
 * Only creates Ethereum and Solana wallets
 */
export const createUserWallets = async (userId: string): Promise<WalletData[] | null> => {
  if (!userId) return null;
  
  // Prevent multiple simultaneous wallet creation attempts
  if (walletCreationInProgress) {
    console.log("Wallet creation already in progress, skipping duplicate request");
    return null;
  }
  
  try {
    walletCreationInProgress = true;
    console.log("Creating wallets for user:", userId);
    
    // First check if user already has wallets to avoid duplicates
    const { data: existingWallets, error: checkError } = await supabase
      .from('wallets')
      .select('id, blockchain, address, currency')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing wallets:", checkError);
      throw new Error(`Failed to check existing wallets: ${checkError.message}`);
    }
    
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User already has ${existingWallets.length} wallets, skipping creation`);
      
      // Filter to only include allowed blockchains
      const filteredWallets = existingWallets.filter(wallet => 
        ALLOWED_BLOCKCHAINS.includes(wallet.blockchain)
      );
      
      // Transform DB wallets to WalletData format
      return filteredWallets.map(wallet => transformWallet(wallet));
    }
    
    // Only proceed with wallet creation if no wallets exist
    const { data, error } = await supabase.functions.invoke('create-wallets', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
    }
    
    // Validate that returned wallets are of supported blockchains
    if (!validateAllowedWallets(data.wallets)) {
      console.error("Received wallets contain unsupported blockchain types");
      toast({
        title: "Warning",
        description: "Some wallet types are not supported and will be ignored",
        variant: "default"
      });
      
      // Filter to only include allowed blockchains
      data.wallets = data.wallets.filter(wallet => 
        ALLOWED_BLOCKCHAINS.includes(wallet.blockchain)
      );
    }
    
    console.log("Wallets created successfully:", data);
    // Transform the created wallets to match WalletData type
    const completeWallets = data.wallets.map(transformWallet);
    return completeWallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
    console.error("Error creating wallets:", errorMessage);
    toast({
      title: "Error creating wallets",
      description: "Please try again later",
      variant: "destructive"
    });
    return null;
  } finally {
    // Reset the flag when done, with a small delay to prevent race conditions
    setTimeout(() => {
      walletCreationInProgress = false;
    }, 2000);
  }
};
