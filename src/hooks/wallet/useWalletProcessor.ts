
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

      // Log all wallet types being processed
      const ethereumWallets = wallets.filter(w => w.blockchain === 'Ethereum');
      const solanaWallets = wallets.filter(w => w.blockchain === 'Solana');
      
      console.log(`Processing ${wallets.length} total wallets:`);
      console.log(`ETH wallets found:`, ethereumWallets);
      console.log(`SOL wallets found:`, solanaWallets);
      
      // Log wallet balances for each wallet
      wallets.forEach(wallet => {
        console.log(`Wallet ${wallet.blockchain} ${wallet.address} balance:`, wallet.balance);
      });

      // Process all wallets (native and token wallets)
      const processedAssets = wallets.map(wallet => {
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        const balance = parseFloat(wallet.balance as any) || 0;
        console.log(`Processing wallet ${wallet.blockchain} with symbol ${symbol}, balance: ${balance}`);
        
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
          id: `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type || 'default'}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: validAddress,
          amount: balance,  // Ensure we're setting the amount correctly
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: balance * (priceData?.price || 0),
          icon: symbol.slice(0, 1),
          platform: priceData?.platform || { name: wallet.blockchain, logo: `/placeholder.svg` },
          walletType: wallet.wallet_type || (wallet.blockchain === wallet.currency ? 'native' : 'token'),
          contractAddress: wallet.contract_address,
        };
        
        console.log("Created asset:", asset);
        return asset;
      });
      
      // Sort assets - native tokens first, then by value
      return processedAssets.sort((a, b) => {
        // Native tokens first
        if (a.walletType === 'native' && b.walletType !== 'native') return -1;
        if (a.walletType !== 'native' && b.walletType === 'native') return 1;
        
        // Then by blockchain (ETH first, then SOL)
        if (a.blockchain === 'Ethereum' && b.blockchain !== 'Ethereum') return -1;
        if (a.blockchain !== 'Ethereum' && b.blockchain === 'Ethereum') return 1;
        if (a.blockchain === 'Solana' && b.blockchain !== 'Solana') return -1;
        if (a.blockchain !== 'Solana' && b.blockchain === 'Solana') return 1;
        
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
