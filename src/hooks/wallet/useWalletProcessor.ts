
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
      
      // Log wallet balances for each wallet with more detail
      wallets.forEach(wallet => {
        // Ensure balance is a number - database might return as string or number
        const balanceValue = typeof wallet.balance === 'string' 
          ? parseFloat(wallet.balance) 
          : (typeof wallet.balance === 'number' ? wallet.balance : 0);
          
        console.log(`Wallet ${wallet.blockchain} ${wallet.address} balance:`, {
          rawBalance: wallet.balance,
          parsedBalance: balanceValue,
          type: typeof wallet.balance
        });
      });

      // Process all wallets (native and token wallets)
      const processedAssets = wallets.map(wallet => {
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        // Convert balance to number and handle possible string values
        const balance = typeof wallet.balance === 'string' 
          ? parseFloat(wallet.balance) 
          : (typeof wallet.balance === 'number' ? wallet.balance : 0);
          
        console.log(`Processing ${wallet.blockchain} wallet with symbol ${symbol}:`, {
          rawBalance: wallet.balance,
          processedBalance: balance,
          valueType: typeof wallet.balance
        });
        
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
        
        // Determine wallet type with fallback logic
        const walletType = wallet.wallet_type || 
          (wallet.blockchain === wallet.currency ? 'native' : 'token');
        
        const asset: Asset = {
          id: `${wallet.blockchain}-${wallet.currency}-${walletType}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: validAddress,
          amount: balance,
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: balance * (priceData?.price || 0),
          icon: symbol.slice(0, 1),
          platform: priceData?.platform || { name: wallet.blockchain, logo: `/placeholder.svg` },
          walletType: walletType,
          contractAddress: wallet.contract_address,
        };
        
        // Additional logging for assets with non-zero balances
        if (asset.amount > 0) {
          console.log(`Created asset with non-zero balance:`, {
            symbol: asset.symbol,
            amount: asset.amount,
            value: asset.value
          });
        }
        
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
