
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates wallets for a user if they don't exist
 */
export const createUserWallets = async (userId: string): Promise<any[] | null> => {
  if (!userId) return null;
  
  try {
    console.log("Creating wallets for user:", userId);
    
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
    return null;
  }
};
