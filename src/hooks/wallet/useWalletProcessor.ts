import { useCallback } from 'react';
import { Asset } from '@/types/assets';

/**
 * Hook for processing wallet data into assets
 */
export const useWalletProcessor = (prices: Record<string, { price: number; change_24h: number; logo?: string; name?: string }>) => {
  const processWallets = useCallback((wallets: any[]): Asset[] => {
    try {
      console.log("Processing wallets:", wallets.length);
      
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
      const assets: Asset[] = [];
      
      Object.entries(currencyNetworkBalances).forEach(([symbol, data]) => {
        const priceData = prices?.[symbol];
        const assetPrice = priceData?.price || 0;
        
        assets.push({
          id: symbol,
          name: priceData?.name || symbol,
          symbol: symbol,
          price: assetPrice,
          amount: data.totalBalance,
          value: data.totalBalance * assetPrice,
          change: priceData?.change_24h || 0,
          icon: symbol[0],
          logo: priceData?.logo || undefined,
          networks: data.networks || {}
        });
      });
      
      // Sort by value (highest first)
      return assets.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error("Error processing wallet data:", error);
      return [];
    }
  }, [prices]);

  return { processWallets };
};
