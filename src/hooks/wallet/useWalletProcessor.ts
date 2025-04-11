
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
  /**
   * Process raw wallet data into Assets
   */
  const processWallets = (wallets: any[]): Asset[] => {
    if (!wallets || wallets.length === 0) {
      return [];
    }
    
    // Track processed wallets with a local set to avoid maintaining state between calls
    // This ensures proper deduplication within a single processing batch
    const processedWalletKeys = new Set<string>();
    
    // Create a deduplication key for each wallet and filter out duplicates
    const uniqueWallets = wallets.filter(wallet => {
      // Create a unique key combining blockchain, currency and address
      const walletKey = `${wallet.blockchain}-${wallet.currency}-${wallet.address}`;
      
      if (processedWalletKeys.has(walletKey)) {
        // Skip this wallet if we've already processed it in this batch
        return false;
      }
      
      // Add to processed set
      processedWalletKeys.add(walletKey);
      return true;
    });
    
    console.log(`Processing ${uniqueWallets.length} unique wallets out of ${wallets.length} total`);
    
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
