import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
}

export const useWallets = ({ prices }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletsCreated, setWalletsCreated] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session, profile } = useAuth();

  const createWalletsForUser = async () => {
    if (!user || !session?.access_token || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Attempting to create wallets for user:", user.id);
      
      // Create wallets request
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      setWalletsCreated(true);
      toast({
        title: 'Success',
        description: 'Your wallets have been created!',
        variant: 'default'
      });
      
      return data.wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      console.error("Error creating wallets:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Error creating wallets',
        description: 'We could not create your wallets. Please try again later.',
        variant: 'destructive',
        duration: 5000,
      });
      setLoading(false);
      return null;
    } finally {
      setCreatingWallets(false);
    }
  };

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

  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!user || !session?.access_token) {
        console.log("No user or session available");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching wallets for user:", user.id);
        
        // Get real wallet balances
        const { data: walletsResponse, error: walletsError } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (walletsError) {
          throw new Error(`Error fetching wallet balances: ${walletsError.message}`);
        }
        
        if (!walletsResponse || !walletsResponse.success || !walletsResponse.wallets || walletsResponse.wallets.length === 0) {
          console.log("No wallets found, attempting to create wallets");
          
          // Try to create wallets
          if (!walletsCreated && !creatingWallets) {
            await createWalletsForUser();
            
            // After creating, try to fetch again
            const { data: newWalletsResponse, error: newWalletsError } = await supabase.functions.invoke('fetch-wallet-balances', {
              method: 'POST',
              body: { userId: user.id }
            });
            
            if (newWalletsError) {
              throw new Error(`Error fetching newly created wallets: ${newWalletsError.message}`);
            }
            
            if (!newWalletsResponse || !newWalletsResponse.success) {
              throw new Error("Failed to retrieve newly created wallets");
            }
            
            processWallets(newWalletsResponse.wallets);
          } else {
            setLoading(false);
          }
          return;
        }
        
        processWallets(walletsResponse.wallets);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
        console.error('Error fetching wallets:', errorMessage);
        setError("Error fetching wallet data: " + errorMessage);
        toast({
          title: 'Error loading wallets',
          description: 'Could not load your wallet data. Please try again later.',
          variant: 'destructive',
          duration: 5000,
        });
        setLoading(false);
      }
    };

    const processWallets = (wallets: any[]) => {
      try {
        console.log("Processing wallets:", wallets);
        // Start with an empty asset list
        const processedAssets: Asset[] = [];
        
        // Group wallets by currency, keeping track of network
        const currencyNetworkBalances: Record<string, { 
          totalBalance: number, 
          networks: Record<string, { address: string, balance: number }>
        }> = {};

        wallets.forEach(wallet => {
          const { currency, blockchain, address, balance: walletBalance } = wallet;
          const balance = typeof walletBalance === 'number' 
            ? walletBalance 
            : parseFloat(String(walletBalance)) || 0;
          
          if (!isNaN(balance)) {
            // Initialize currency entry if it doesn't exist
            if (!currencyNetworkBalances[currency]) {
              currencyNetworkBalances[currency] = { 
                totalBalance: 0, 
                networks: {} 
              };
            }
            
            // Add to total balance for this currency
            currencyNetworkBalances[currency].totalBalance += balance;
            
            // Add network-specific data
            currencyNetworkBalances[currency].networks[blockchain] = {
              address,
              balance
            };
          }
        });
        
        // Convert to assets array
        Object.entries(currencyNetworkBalances).forEach(([symbol, data]) => {
          // Create asset without relying on demo data
          const asset: Asset = {
            id: symbol,
            name: getAssetName(symbol),
            symbol,
            price: prices?.[symbol]?.price || 0,
            amount: data.totalBalance,
            value: data.totalBalance * (prices?.[symbol]?.price || 0),
            change: prices?.[symbol]?.change_24h || 0,
            icon: symbol[0].toUpperCase(),
            networks: data.networks || {}
          };
          
          processedAssets.push(asset);
        });
        
        console.log("Processed assets:", processedAssets);
        
        // Sort by value (highest first)
        processedAssets.sort((a, b) => b.value - a.value);
        
        setAssets(processedAssets);
        setLoading(false);
      } catch (processError) {
        console.error("Error processing wallet data:", processError);
        setError("Failed to process wallet data: " + (processError instanceof Error ? processError.message : "Unknown error"));
        setLoading(false);
      }
    };
    
    // Helper function to get proper asset names
    const getAssetName = (symbol: string): string => {
      switch(symbol.toUpperCase()) {
        case 'BTC': return 'Bitcoin';
        case 'ETH': return 'Ethereum';
        case 'SOL': return 'Solana';
        case 'USDT': return 'Tether';
        case 'TRX': return 'Tron';
        case 'BNB': return 'Binance Coin';
        case 'MATIC': return 'Polygon';
        case 'MONAD': return 'Monad';
        case 'SUI': return 'Sui';
        case 'XRP': return 'XRP';
        case 'ADA': return 'Cardano';
        case 'DOT': return 'Polkadot';
        case 'DOGE': return 'Dogecoin';
        case 'LINK': return 'Chainlink';
        default: return symbol;
      }
    };

    // Start fetching
    fetchUserAssets();
    
    // Ensure we never leave loading state on unmount
    return () => {
      setLoading(false);
    };
  }, [user, prices, session, walletsCreated, creatingWallets]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Safety timeout reached - forcing loading state to complete");
        setLoading(false);
      }
    }, 3000); // 3 second maximum timeout
    
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  return { 
    assets, 
    loading, 
    isCreatingWallets: creatingWallets,
    error,
    createWallets: createWalletsForUser 
  };
};
