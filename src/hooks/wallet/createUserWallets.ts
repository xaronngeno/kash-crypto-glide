
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Create initial wallets for a user
export const createUserWallets = async (userId: string) => {
  try {
    console.log('Creating wallets for user:', userId);
    
    // Call Supabase function to create wallets
    const { data, error } = await supabase.functions.invoke('create-wallets', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from wallet creation function');
    }
    
    toast({
      title: 'Wallets created successfully',
      description: 'Your Ethereum and Solana wallets have been created',
    });
    
    return data.wallets || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error creating wallets:', errorMessage);
    
    toast({
      title: 'Error creating wallets',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return [];
  }
};
