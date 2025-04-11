
import { useState, useEffect, useRef } from 'react';
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
}

export const useWallets = ({ prices }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  
  // Track wallet creation status
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  
  // Get the wallet processor
  const { processWallets } = useWalletProcessor(prices);
  
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
    // Small timeout to let React render first
    const timeoutId = setTimeout(() => {
      const loadUserAssets = async () => {
        if (!user || !session?.access_token) {
          console.log("No user or session available");
          return;
        }
        
        setError(null);
        
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
            
            // Only create wallets once
            if (!walletsCreated) {
              const newWallets = await createUserWallets(user.id);
              if (newWallets && newWallets.length > 0) {
                markWalletsAsCreated();
                const processedAssets = processWallets(newWallets);
                setAssets(processedAssets);
              }
            }
            
            return;
          }
          
          // Process the wallet data into assets
          const processedAssets = processWallets(wallets);
          setAssets(processedAssets);
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          console.error('Error in useWallets:', errorMessage);
          setError(errorMessage);
        }
      };
  
      loadUserAssets();
      
      // Set up periodic refresh in the background
      const refreshInterval = setInterval(() => {
        if (user?.id) {
          loadUserAssets();
        }
      }, 60000); // Every 60 seconds
      
      return () => {
        clearInterval(refreshInterval);
      };
    }, 10); // Small delay
    
    return () => clearTimeout(timeoutId);
  }, [user, session, processWallets, walletsCreated, markWalletsAsCreated]);

  return { 
    assets, 
    loading: false,
    error
  };
};
