
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

      // Filter out Bitcoin wallets and log remaining wallets
      const filteredWallets = wallets.filter(w => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC');
      
      // Log all wallet types being processed
      const ethereumWallets = filteredWallets.filter(w => w.blockchain === 'Ethereum');
      const solanaWallets = filteredWallets.filter(w => w.blockchain === 'Solana');
      
      console.log(`Processing ${filteredWallets.length} total wallets:`);
      console.log(`ETH wallets found: ${ethereumWallets.length > 0 ? JSON.stringify(ethereumWallets) : 'None'}`);
      console.log(`SOL wallets found: ${solanaWallets.length > 0 ? JSON.stringify(solanaWallets) : 'None'}`);
      
      if (ethereumWallets.length > 0) console.log("Has Ethereum ETH:", true);
      if (solanaWallets.length > 0) console.log("Has Solana SOL:", true);

      return filteredWallets.map(wallet => {
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        // Validate address format based on blockchain type
        let validAddress = wallet.address || 'Address Not Available';
        let validationPassed = true;
        
        // Format validation for popular blockchains
        if (wallet.blockchain === 'Ethereum' && !isEthereumAddress(validAddress)) {
          console.warn(`Warning: Ethereum address doesn't match expected format: ${validAddress}`);
          validationPassed = false;
        }
        
        if (wallet.blockchain === 'Solana' && !isSolanaAddress(validAddress)) {
          console.warn(`Warning: Solana address doesn't match expected format: ${validAddress}`);
          validationPassed = false;
        }
        
        if (!validationPassed && process.env.NODE_ENV === 'development') {
          console.info('Continuing with address despite validation failure (development mode)');
        }
        
        const asset: Asset = {
          id: `${wallet.blockchain}-${wallet.currency}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: validAddress,
          amount: parseFloat(wallet.balance as any) || 0,
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: (parseFloat(wallet.balance as any) || 0) * (priceData?.price || 0),
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
