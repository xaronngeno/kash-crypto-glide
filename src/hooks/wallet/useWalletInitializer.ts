
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
              
              // Ensure wallet balances have 12 decimal places
              const walletsWithPreciseBalances = newWallets.map(wallet => ({
                ...wallet,
                balance: typeof wallet.balance === 'number' ? 
                  parseFloat(wallet.balance.toFixed(12)) : 
                  typeof wallet.balance === 'string' ? 
                    parseFloat(parseFloat(wallet.balance).toFixed(12)) : 0
              }));
              
              const processedAssets = processWallets(walletsWithPreciseBalances);
              console.log("Processed new wallet assets with 12 decimals:", processedAssets);
              
              setAssets(processedAssets);
              cacheAssets(processedAssets);
            }
          } catch (createError) {
            console.error("Error creating wallets:", createError);
          }
        }
        
        return;
      }
      
      // Ensure wallet balances are properly logged with 12 decimals before processing
      console.log("Raw wallets before processing:", wallets.map(w => {
        const balanceAsNumber = typeof w.balance === 'string' ? 
          parseFloat(w.balance) : 
          typeof w.balance === 'number' ? 
            w.balance : 0;
            
        return {
          blockchain: w.blockchain,
          address: w.address,
          balance: balanceAsNumber,
          balanceType: typeof balanceAsNumber,
          balanceString: balanceAsNumber.toFixed(12),
          nonZero: balanceAsNumber > 0
        };
      }));
      
      // Ensure all wallets have balances with 12 decimal places
      const walletsWithPreciseBalances = wallets.map(wallet => ({
        ...wallet,
        balance: typeof wallet.balance === 'number' ? 
          parseFloat(wallet.balance.toFixed(12)) : 
          typeof wallet.balance === 'string' ? 
            parseFloat(parseFloat(wallet.balance).toFixed(12)) : 0
      }));
      
      console.log("Processing wallets into assets...");
      const processedAssets = processWallets(walletsWithPreciseBalances);
      
      // Log detailed information about processed assets with 12 decimals
      console.log("Processed assets:", processedAssets);
      console.log("Assets with non-zero balances:", 
        processedAssets.filter(a => a.amount > 0));
      
      // Log asset amounts for debugging
      processedAssets.forEach(asset => {
        console.log(`Asset ${asset.symbol} balance details:`, {
          amount: asset.amount,
          exactAmount: asset.amount.toFixed(12),
          value: asset.value,
          isNonZero: asset.amount > 0,
          amountType: typeof asset.amount
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
