
import { supabase } from '@/integrations/supabase/client';
import { generateWalletsFromSeed } from '@/utils/walletGenerators';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  matches: string[];
  mismatches: string[];
}

/**
 * Validates a seed phrase by generating wallets and comparing with user's existing wallets
 */
export const validateSeedPhrase = async (
  phrase: string, 
  userId: string | undefined
): Promise<ValidationResult> => {
  const { toast } = useToast();
  
  if (!userId) {
    toast({
      title: "Authentication Error",
      description: "You must be logged in to validate a seed phrase",
      variant: "destructive"
    });
    return { isValid: false, matches: [], mismatches: [] };
  }

  try {
    console.log("Validating seed phrase:", phrase);
    
    // Generate wallets from the provided seed phrase
    const wallets = await generateWalletsFromSeed(phrase);
    
    if (!wallets || wallets.length === 0) {
      throw new Error("Failed to generate wallets from seed phrase");
    }
    
    // Extract addresses for comparison
    const generatedAddresses = {
      ethereum: wallets.find(w => w.blockchain === 'Ethereum')?.address?.toLowerCase(),
      solana: wallets.find(w => w.blockchain === 'Solana')?.address,
      bitcoin: wallets.find(w => w.blockchain === 'Bitcoin')?.address,
      tron: wallets.find(w => w.blockchain === 'Tron')?.address
    };
    
    console.log("Generated addresses from seed phrase:", generatedAddresses);
    
    // Get user's actual wallets from the database
    const { data: userWallets, error } = await supabase
      .from('wallets')
      .select('blockchain, address, currency, wallet_type')
      .eq('user_id', userId);
      
    if (error) {
      throw new Error(`Failed to fetch user wallets: ${error.message}`);
    }
    
    console.log("User's wallet addresses:", userWallets);
    
    // Extract the user's actual addresses
    const userAddresses = {
      ethereum: userWallets?.find(w => w.blockchain === 'Ethereum' && w.currency === 'ETH')?.address?.toLowerCase(),
      solana: userWallets?.find(w => w.blockchain === 'Solana' && w.currency === 'SOL')?.address,
      bitcoin: userWallets?.find(w => w.blockchain === 'Bitcoin' && (w.wallet_type === 'Native SegWit' || !w.wallet_type))?.address,
      tron: userWallets?.find(w => w.blockchain === 'Tron')?.address
    };
    
    console.log("Comparing addresses:");
    console.log("- User addresses:", userAddresses);
    console.log("- Generated addresses:", generatedAddresses);
    
    // Compare addresses to validate
    const matches: string[] = [];
    const mismatches: string[] = [];
    
    if (generatedAddresses.ethereum && userAddresses.ethereum) {
      console.log("Comparing Ethereum addresses:");
      console.log("- Generated:", generatedAddresses.ethereum);
      console.log("- User's:", userAddresses.ethereum);
      
      if (generatedAddresses.ethereum === userAddresses.ethereum) {
        matches.push('Ethereum');
      } else {
        mismatches.push('Ethereum');
      }
    }
    
    if (generatedAddresses.solana && userAddresses.solana) {
      console.log("Comparing Solana addresses:");
      console.log("- Generated:", generatedAddresses.solana);
      console.log("- User's:", userAddresses.solana);
      
      if (generatedAddresses.solana === userAddresses.solana) {
        matches.push('Solana');
      } else {
        mismatches.push('Solana');
      }
    }
    
    if (generatedAddresses.bitcoin && userAddresses.bitcoin) {
      console.log("Comparing Bitcoin addresses:");
      console.log("- Generated:", generatedAddresses.bitcoin);
      console.log("- User's:", userAddresses.bitcoin);
      
      if (generatedAddresses.bitcoin === userAddresses.bitcoin) {
        matches.push('Bitcoin');
      } else {
        mismatches.push('Bitcoin');
      }
    }
    
    if (generatedAddresses.tron && userAddresses.tron) {
      console.log("Comparing Tron addresses:");
      console.log("- Generated:", generatedAddresses.tron);
      console.log("- User's:", userAddresses.tron);
      
      if (generatedAddresses.tron === userAddresses.tron) {
        matches.push('Tron');
      } else {
        mismatches.push('Tron');
      }
    }

    return {
      isValid: matches.length > 0,
      matches,
      mismatches
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to validate seed phrase";
    console.error("Validation error:", errorMessage);
    throw new Error(errorMessage);
  }
};
