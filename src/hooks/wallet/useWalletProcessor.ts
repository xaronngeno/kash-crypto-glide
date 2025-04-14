
import { useState, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { CryptoPrices } from '@/hooks/useCryptoPrices';

export const useWalletProcessor = (prices: CryptoPrices) => {
  const [error, setError] = useState<string | null>(null);
  
  const processWallets = useCallback((wallets: any[]): Asset[] => {
    try {
      if (!wallets || wallets.length === 0) {
        console.log('No wallets to process');
        return [];
      }

      console.log('Processing wallets:', JSON.stringify(wallets, null, 2));

      return wallets.map(wallet => {
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        console.log(`Processing wallet for ${symbol}:`, {
          address: wallet.address,
          blockchain: wallet.blockchain,
          balance: wallet.balance
        });
        
        const asset: Asset = {
          id: `${wallet.blockchain}-${wallet.currency}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: wallet.address,
          amount: parseFloat(wallet.balance as any) || 0,
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: (parseFloat(wallet.balance as any) || 0) * (priceData?.price || 0),
          // Add the icon property derived from the symbol
          icon: symbol.slice(0, 1),
          platform: priceData?.platform || { name: wallet.blockchain, logo: `/placeholder.svg` },
          walletType: wallet.wallet_type,
        };
        
        return asset;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error processing wallets:", errorMessage);
      setError(errorMessage);
      return [];
    }
  }, [prices]);

  return { processWallets, error };
};
