
import { useState } from 'react';
import { Asset } from '@/types/assets';

/**
 * Process wallet data from the API into a format usable by the UI
 */
export const useWalletProcessor = (prices: Record<string, { price: number; change_24h: number }>) => {
  // Track if wallets have been processed already to avoid duplicates
  const [processedWalletIds, setProcessedWalletIds] = useState<Set<string>>(new Set());
  
  /**
   * Process raw wallet data into Assets
   */
  const processWallets = (wallets: any[]): Asset[] => {
    if (!wallets || wallets.length === 0) {
      return [];
    }
    
    // Create a deduplication key for each wallet
    const uniqueWallets = wallets.filter(wallet => {
      const walletKey = `${wallet.blockchain}-${wallet.currency}-${wallet.address}`;
      if (processedWalletIds.has(walletKey)) {
        // Skip this wallet if we've already processed it
        return false;
      }
      
      // Add to processed set
      processedWalletIds.add(walletKey);
      return true;
    });
    
    console.log(`Processing ${uniqueWallets.length} unique wallets out of ${wallets.length} total`);
    
    // Convert wallets to assets
    const assets: Asset[] = uniqueWallets.map(wallet => {
      const priceData = prices[wallet.currency];
      const price = priceData ? priceData.price : 0;
      const change = priceData ? priceData.change_24h : 0;
      
      return {
        id: `${wallet.blockchain}-${wallet.currency}`,
        blockchain: wallet.blockchain,
        symbol: wallet.currency,
        name: wallet.currency,
        amount: parseFloat(wallet.balance) || 0,
        price: price,
        change: change,
        value: (parseFloat(wallet.balance) || 0) * (price || 0),
        address: wallet.address,
        logo: `/coins/${wallet.currency.toLowerCase()}.png`
      };
    });
    
    return assets;
  };
  
  return { processWallets };
};
