import { Asset } from '@/types/assets';
import { CryptoPrices } from '@/hooks/useCryptoPrices';

/**
 * Process wallet data from the API into a format usable by the UI
 */
export const useWalletProcessor = (prices: CryptoPrices) => {
  /**
   * Process raw wallet data into Assets
   */
  const processWallets = (wallets: any[]): Asset[] => {
    if (!wallets || wallets.length === 0) {
      return [];
    }
    
    // Create a more robust deduplication mechanism using a Map
    // This ensures we only keep one wallet per blockchain/currency combination
    const uniqueWalletsMap = new Map<string, any>();
    
    // Process wallets and keep only the most recent entry for each blockchain/currency pair
    wallets.forEach(wallet => {
      // Create a unique key combining blockchain and currency
      const walletKey = `${wallet.blockchain}-${wallet.currency}`;
      
      // If this wallet type doesn't exist in our map yet, or if this wallet has a more recent update_at timestamp
      // than the one in our map, use this wallet
      if (!uniqueWalletsMap.has(walletKey) || 
          (wallet.updated_at && uniqueWalletsMap.get(walletKey).updated_at && 
           new Date(wallet.updated_at) > new Date(uniqueWalletsMap.get(walletKey).updated_at))) {
        uniqueWalletsMap.set(walletKey, wallet);
      }
    });
    
    // Convert the Map values to an array
    const uniqueWallets = Array.from(uniqueWalletsMap.values());
    
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
