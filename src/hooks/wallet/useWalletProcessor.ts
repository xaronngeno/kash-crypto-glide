
import { useState } from 'react';
import { Asset } from '@/types/assets';

/**
 * Process wallet data from the API into a format usable by the UI
 */
export const useWalletProcessor = (prices: Record<string, { 
  price: number; 
  change_24h: number;
  logo?: string;
  name?: string;
  platform?: { name: string; logo: string };
}>) => {
  // Track if wallets have been processed already to avoid duplicates
  const [processedWalletIds, setProcessedWalletIds] = useState<Set<string>>(new Set());
  
  /**
   * Process raw wallet data into Assets
   */
  const processWallets = (wallets: any[]): Asset[] => {
    if (!wallets || wallets.length === 0) {
      return [];
    }
    
    // Reset the processed wallets on each call to avoid maintaining state between calls
    // This fixes the issue where all wallets were being filtered out
    const currentProcessed = new Set<string>();
    
    // Create a deduplication key for each wallet
    const uniqueWallets = wallets.filter(wallet => {
      const walletKey = `${wallet.blockchain}-${wallet.currency}-${wallet.address}`;
      if (currentProcessed.has(walletKey)) {
        // Skip this wallet if we've already processed it in this batch
        return false;
      }
      
      // Add to processed set
      currentProcessed.add(walletKey);
      return true;
    });
    
    console.log(`Processing ${uniqueWallets.length} unique wallets out of ${wallets.length} total`);
    
    // Update the state with new processed wallets
    setProcessedWalletIds(currentProcessed);
    
    // Convert wallets to assets
    const assets: Asset[] = uniqueWallets.map(wallet => {
      const priceData = prices[wallet.currency];
      const price = priceData ? priceData.price : 0;
      const change = priceData ? priceData.change_24h : 0;
      
      // Use CoinMarketCap logo if available
      const coinmarketcapLogo = priceData?.logo;
      const fallbackLogo = `/coins/${wallet.currency.toLowerCase()}.png`;
      
      return {
        id: `${wallet.blockchain}-${wallet.currency}`,
        blockchain: wallet.blockchain,
        symbol: wallet.currency,
        name: priceData?.name || wallet.currency,
        amount: parseFloat(wallet.balance) || 0,
        price: price,
        change: change,
        value: (parseFloat(wallet.balance) || 0) * (price || 0),
        address: wallet.address,
        // Use CoinMarketCap logo if available, otherwise fallback to local logo
        logo: coinmarketcapLogo || fallbackLogo,
        // Add the required icon property
        icon: wallet.currency.charAt(0).toUpperCase(), // Use first character of currency as fallback icon
        // Add network information if available from CMC
        platform: priceData?.platform ? {
          name: priceData.platform.name,
          logo: priceData.platform.logo
        } : undefined
      };
    });
    
    return assets;
  };
  
  return { processWallets };
};
