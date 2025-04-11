
import { useState, useEffect, useRef, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { 
  fetchWalletBalances,
  createUserWallets,
  useWalletCreationStatus,
  useWalletProcessor
} from './useWalletBalance';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
  skipInitialLoad?: boolean;
}

export const useWallets = ({ prices, skipInitialLoad = false }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!skipInitialLoad);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, session } = useAuth();
  
  // Track wallet creation status
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  
  // Get the wallet processor
  const { processWallets } = useWalletProcessor(prices);
  
  // Flag to prevent multiple wallet creation attempts
  const walletCreationAttempted = useRef(false);
  // Flag to track if initial load has been done
  const initialLoadDone = useRef(false);
  
  // Function to manually reload wallet data
  const reload = useCallback(() => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Update asset prices when prices change
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setAssets(prevAssets => 
        prevAssets.map(asset => {
          const priceData = prices[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
              change: priceData.change_24h,
              value: asset.amount * priceData.price
            };
          }
          return asset;
        })
      );
    }
  }, [prices]);

  // Fetch user assets with a small delay to allow UI to render first
  useEffect(() => {
    // Skip loading if skipInitialLoad is true and initialLoadDone is true
    if (skipInitialLoad && initialLoadDone.current) {
      return;
    }
    
    // Small timeout to let React render first
    const timeoutId = setTimeout(() => {
      const loadUserAssets = async () => {
        if (!user || !session?.access_token) {
          console.log("No user or session available");
          return;
        }
        
        setError(null);
        if (!skipInitialLoad || !initialLoadDone.current) {
          setLoading(true);
        }
        
        try {
          // Fetch wallet balances
          const wallets = await fetchWalletBalances({
            userId: user.id,
            onError: (err) => {
              setError(err.message);
              toast({
                title: "Error",
                description: "Failed to load wallet data",
                variant: "destructive"
              });
            }
          });
          
          if (!wallets || wallets.length === 0) {
            console.log("No wallets found, creating initial wallets");
            
            // Only create wallets once and only if not created before
            if (!walletsCreated && !walletCreationAttempted.current) {
              walletCreationAttempted.current = true;
              
              try {
                const newWallets = await createUserWallets(user.id);
                if (newWallets && newWallets.length > 0) {
                  markWalletsAsCreated();
                  const processedAssets = processWallets(newWallets);
                  setAssets(processedAssets);
                }
              } catch (createError) {
                console.error("Error creating wallets:", createError);
                // Don't show toast here as the fetchWalletBalances already shows one
              }
            }
            
            return;
          }
          
          // Process the wallet data into assets
          const processedAssets = processWallets(wallets);
          setAssets(processedAssets);
          initialLoadDone.current = true;
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          console.error('Error in useWallets:', errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
  
      loadUserAssets();
      
    }, 10); // Small delay
    
    return () => clearTimeout(timeoutId);
  }, [user, session, processWallets, walletsCreated, markWalletsAsCreated, refreshCounter, skipInitialLoad]);

  return { 
    assets, 
    loading,
    error,
    reload
  };
};
