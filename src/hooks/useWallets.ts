
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
  const { user, session } = useAuth();
  
  const defaultAssetsMap = {
    'BTC': { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 0, amount: 0, value: 0, change: 0, icon: '₿' },
    'ETH': { id: '2', name: 'Ethereum', symbol: 'ETH', price: 0, amount: 0, value: 0, change: 0, icon: 'Ξ' },
    'USDT': { id: '3', name: 'USDT', symbol: 'USDT', price: 1.00, amount: 0, value: 0, change: 0, icon: '₮' },
    'SOL': { id: '4', name: 'Solana', symbol: 'SOL', price: 0, amount: 0, value: 0, change: 0, icon: 'Ѕ' },
    'MATIC': { id: '5', name: 'Polygon', symbol: 'MATIC', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'SUI': { id: '6', name: 'Sui', symbol: 'SUI', price: 0, amount: 0, value: 0, change: 0, icon: 'S' },
    'MONAD': { id: '7', name: 'Monad', symbol: 'MONAD', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'BNB': { id: '8', name: 'Binance Coin', symbol: 'BNB', price: 0, amount: 0, value: 0, change: 0, icon: 'B' },
    'XRP': { id: '9', name: 'XRP', symbol: 'XRP', price: 0, amount: 0, value: 0, change: 0, icon: 'X' },
    'ADA': { id: '10', name: 'Cardano', symbol: 'ADA', price: 0, amount: 0, value: 0, change: 0, icon: 'A' },
    'DOGE': { id: '11', name: 'Dogecoin', symbol: 'DOGE', price: 0, amount: 0, value: 0, change: 0, icon: 'D' },
    'DOT': { id: '12', name: 'Polkadot', symbol: 'DOT', price: 0, amount: 0, value: 0, change: 0, icon: 'P' },
    'LINK': { id: '13', name: 'Chainlink', symbol: 'LINK', price: 0, amount: 0, value: 0, change: 0, icon: 'L' }
  };

  const createWalletsForUser = async () => {
    if (!user || !session?.access_token || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: {}
      });
      
      if (error) {
        throw new Error(`Function returned error: ${error.message}`);
      }
      
      setWalletsCreated(true);
      toast({
        title: 'Success',
        description: 'Your wallets have been created!',
        variant: 'default'
      });
      
      return data.wallets;
    } catch (err) {
      console.error("Error creating wallets:", err);
      toast({
        title: 'Error',
        description: 'Failed to create user wallets. Please refresh or try again later.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setCreatingWallets(false);
    }
  };

  // Update asset prices when price data changes
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

  // Fetch user wallets on component mount
  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!user || !session?.access_token) return;
      
      try {
        setLoading(true);
        
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) {
          throw walletsError;
        }
        
        if (!wallets || wallets.length === 0) {
          if (!walletsCreated && !creatingWallets) {
            const newWallets = await createWalletsForUser();
            
            if (newWallets && newWallets.length > 0) {
              processWallets(newWallets);
              return;
            }
          }
        } else {
          processWallets(wallets);
          return;
        }
        
        setAssets(Object.values(defaultAssetsMap));
        
      } catch (err) {
        console.error('Error fetching wallets:', err);
        toast({
          title: 'Error',
          description: 'Failed to load wallet data',
          variant: 'destructive'
        });
        setAssets(Object.values(defaultAssetsMap));
      } finally {
        setLoading(false);
      }
    };

    const processWallets = (wallets: any[]) => {
      const initialAssets = Object.values(defaultAssetsMap).map(asset => ({...asset}));
      const currencyBalances: Record<string, number> = {};

      wallets.forEach(wallet => {
        const currency = wallet.currency;
        const walletBalance = typeof wallet.balance === 'number' 
          ? wallet.balance 
          : parseFloat(String(wallet.balance)) || 0;
        
        if (!isNaN(walletBalance)) {
          if (!currencyBalances[currency]) {
            currencyBalances[currency] = 0;
          }
          currencyBalances[currency] += walletBalance;
        }
      });
      
      const updatedAssets = initialAssets.map(asset => {
        const balance = currencyBalances[asset.symbol] || 0;
        const assetPrice = prices?.[asset.symbol]?.price || asset.price;
        
        return {
          ...asset,
          amount: balance,
          price: assetPrice,
          value: balance * assetPrice
        };
      });
      
      setAssets(updatedAssets);
    };

    fetchUserAssets();
  }, [user, prices, session, walletsCreated, creatingWallets]);

  return { assets, loading, isCreatingWallets: creatingWallets };
};
