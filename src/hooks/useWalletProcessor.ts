
import { useState, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { CryptoPrices } from '@/hooks/useCryptoPrices';
import { isEthereumAddress, isSolanaAddress } from '@/utils/addressValidator';

export const useWalletProcessor = (prices: CryptoPrices) => {
  const [error, setError] = useState<string | null>(null);
  
  const processWallets = useCallback((wallets: any[]): Asset[] => {
    try {
      if (!wallets || wallets.length === 0) {
        console.log('No wallets to process');
        return [];
      }

      // Process all wallets (native and token wallets)
      const processedAssets = wallets.map(wallet => {
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        // Improved balance conversion
        let balance = 0;
        if (wallet.balance !== undefined) {
          balance = Number(wallet.balance);
          
          // Ensure small balances are not dropped
          if (balance > 0 && balance < 0.001) {
            balance = Number(wallet.balance.toFixed(6));
          }
        }
          
        console.log(`Processing ${wallet.blockchain} wallet with symbol ${symbol}:`, {
          rawBalance: wallet.balance,
          processedBalance: balance,
          valueType: typeof wallet.balance
        });
        
        const asset: Asset = {
          id: `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: wallet.address || 'Address Not Available',
          amount: balance,
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: balance * (priceData?.price || 0),
          icon: symbol.slice(0, 1),
          platform: priceData?.platform || { name: wallet.blockchain, logo: `/placeholder.svg` },
          walletType: wallet.wallet_type || 'native',
          contractAddress: wallet.contract_address,
        };
        
        // Extensive logging for diagnostics
        console.log(`Created asset:`, {
          symbol: asset.symbol,
          amount: asset.amount,
          value: asset.value,
          blockchain: asset.blockchain
        });
        
        return asset;
      });
      
      // Additional logging
      const nonZeroAssets = processedAssets.filter(a => a.amount > 0);
      console.log('Processed non-zero assets:', nonZeroAssets);
      
      // Sort assets - native tokens first, then by value
      return processedAssets.sort((a, b) => {
        // Native tokens first
        if (a.walletType === 'native' && b.walletType !== 'native') return -1;
        if (a.walletType !== 'native' && b.walletType === 'native') return 1;
        
        // Then by value (highest first)
        return b.value - a.value;
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
