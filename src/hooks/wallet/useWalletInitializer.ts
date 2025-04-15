
import { useCallback } from 'react';
import { Asset } from '@/types/assets';
import { CryptoPrices } from '@/hooks/useCryptoPrices';
import { fetchWalletBalances, createUserWallets } from '@/hooks/wallet/fetchWalletBalances';
import { toast } from '@/hooks/use-toast';
import { useWalletCreationStatus } from '@/hooks/wallet';
import { useWalletProcessor } from '@/hooks/wallet';

interface UseWalletInitializerProps {
  prices: CryptoPrices;
  setError: (error: string | null) => void;
  setAssets: (assets: Asset[]) => void;
  cacheAssets: (assets: Asset[]) => void;
}

export const useWalletInitializer = ({ 
  prices, 
  setError, 
  setAssets,
  cacheAssets
}: UseWalletInitializerProps) => {
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  const { processWallets } = useWalletProcessor(prices);
  
  /**
   * Initialize user wallets - fetch, create if missing, process assets
   */
  const initializeWallets = useCallback(async (userId: string) => {
    try {
      console.log(`Initializing wallets for user ${userId}`);
      const wallets = await fetchWalletBalances({
        userId,
        onError: (err) => {
          setError(err.message);
          toast({
            title: "Error",
            description: "Failed to load wallet data",
            variant: "destructive"
          });
        },
        forceRefresh: true // Force refresh to get the latest balances
      });
      
      if (!wallets || wallets.length === 0) {
        console.log("No wallets found, creating initial wallets");
        
        if (!walletsCreated) {
          try {
            const newWallets = await createUserWallets(userId);
            console.log("Created new wallets:", newWallets);
            
            if (newWallets && newWallets.length > 0) {
              markWalletsAsCreated();
              const processedAssets = processWallets(newWallets);
              console.log("Processed new wallet assets:", processedAssets);
              
              setAssets(processedAssets);
              cacheAssets(processedAssets);
            }
          } catch (createError) {
            console.error("Error creating wallets:", createError);
          }
        }
        
        return;
      }
      
      // Ensure wallet balances are properly logged before processing
      console.log("Raw wallets before processing:", wallets.map(w => ({
        blockchain: w.blockchain,
        address: w.address,
        balance: w.balance,
        balanceType: typeof w.balance,
        nonZero: w.balance > 0
      })));
      
      console.log("Processing wallets into assets...");
      const processedAssets = processWallets(wallets);
      
      // Log detailed information about processed assets
      console.log("Processed assets:", processedAssets);
      console.log("Assets with non-zero balances:", 
        processedAssets.filter(a => a.amount > 0));
      
      // Log asset amounts for debugging
      processedAssets.forEach(asset => {
        console.log(`Asset ${asset.symbol} balance details:`, {
          amount: asset.amount,
          exactAmount: asset.amount.toString(),
          value: asset.value,
          isNonZero: asset.amount > 0
        });
      });
      
      setAssets(processedAssets);
      cacheAssets(processedAssets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error initializing wallets";
      console.error('Error in wallet initialization:', errorMessage);
      setError(errorMessage);
    }
  }, [processWallets, walletsCreated, markWalletsAsCreated, setError, setAssets, cacheAssets]);

  return { initializeWallets };
};
