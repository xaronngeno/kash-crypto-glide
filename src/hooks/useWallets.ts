
import { useState, useEffect, useRef, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { 
  fetchWalletBalances,
  createUserWallets,
  useWalletCreationStatus,
  useWalletProcessor
} from './wallet';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
}

export const useWallets = ({ prices }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, session } = useAuth();
  
  // Track wallet creation status
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  
  // Get the wallet processor
  const { processWallets } = useWalletProcessor(prices);
  
  // Flag to prevent multiple wallet creation attempts
  const walletCreationAttempted = useRef(false);
  
  // Function to manually reload wallet data
  const reload = useCallback(() => {
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

  // Fetch user assets
  useEffect(() => {
    // Don't attempt to load if no user
    if (!user || !session?.access_token) {
      console.log("No user or session available");
      setLoading(false);
      return;
    }
      
    setError(null);
    setLoading(true);
    
    const loadUserAssets = async () => {
      try {
        // Fetch wallet balances with robust error handling
        const wallets = await fetchWalletBalances({
          userId: user.id,
          useLocalCache: true,
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
            }
          }
          
          setLoading(false);
          return;
        }
        
        // Process the wallet data into assets
        const processedAssets = processWallets(wallets);
        setAssets(processedAssets);
        setLoading(false);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error('Error in useWallets:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    };

    // Add a small delay to let the UI render first
    const timeoutId = setTimeout(() => {
      loadUserAssets();
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [user, session, processWallets, walletsCreated, markWalletsAsCreated, refreshCounter]);

  return { 
    assets, 
    loading,
    error,
    reload
  };
};
