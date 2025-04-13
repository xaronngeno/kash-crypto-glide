
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Flag to prevent multiple wallet creation attempts
let walletCreationInProgress = false;

/**
 * Creates wallets for a user if they don't exist
 * With added protection against duplicate wallet creation requests
 */
export const createUserWallets = async (userId: string): Promise<any[] | null> => {
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
      .select('id, blockchain, currency')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing wallets:", checkError);
      throw new Error(`Failed to check existing wallets: ${checkError.message}`);
    }
    
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User already has ${existingWallets.length} wallets, skipping creation`);
      return existingWallets;
    }
    
    // Only proceed with wallet creation if no wallets exist
    const { data, error } = await supabase.functions.invoke('create-wallets', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
    }
    
    console.log("Wallets created successfully:", data);
    return data.wallets || [];
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
