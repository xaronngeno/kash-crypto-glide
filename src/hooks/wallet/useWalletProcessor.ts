
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
      
      // Process all wallets (native and token wallets)
      const processedAssets = wallets.map(wallet => {
        // Ensure we have the proper symbol
        const symbol = wallet.currency || 'Unknown';
        const priceData = prices[symbol];
        
        // CRITICAL: Ensure balance is properly preserved as a number with exactly 12 decimal places
        let balance: number;
        
        // Handle different types of balance data that could come from the API
        if (typeof wallet.balance === 'string') {
          // Parse string to float, preserving decimal precision
          balance = parseFloat(parseFloat(wallet.balance).toFixed(12));
        } else if (typeof wallet.balance === 'number') {
          // Use number directly, but ensure 12 decimal precision
          balance = parseFloat(wallet.balance.toFixed(12));
        } else if (wallet.balance === null || wallet.balance === undefined) {
          // Handle null/undefined case
          balance = 0;
        } else {
          // Last resort - try to convert whatever it is to a number with 12 decimals
          balance = parseFloat(Number(wallet.balance).toFixed(12)) || 0;
        }
          
        // Debug logging for balance conversion
        console.log(`Processing ${wallet.blockchain} wallet with symbol ${symbol}:`, {
          rawBalance: wallet.balance,
          processedBalance: balance,
          valueType: typeof balance,
          stringValue: balance.toFixed(12),
          isNonZero: balance > 0
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
        
        // Create the asset with precise 12 decimal balance handling
        const asset: Asset = {
          id: `${wallet.blockchain}-${wallet.currency}-${walletType}`,
          name: priceData?.name || wallet.currency || 'Unknown',
          symbol: symbol,
          logo: priceData?.logo || `/placeholder.svg`,
          blockchain: wallet.blockchain,
          address: validAddress,
          amount: balance, // Use properly processed balance with 12 decimals
          price: priceData?.price || 0,
          change: priceData?.change_24h || 0,
          value: balance * (priceData?.price || 0),
          icon: symbol.slice(0, 1),
          platform: priceData?.platform || { name: wallet.blockchain, logo: `/placeholder.svg` },
          walletType: walletType,
          contractAddress: wallet.contract_address,
        };
        
        // Additional logging for all assets with 12 decimal precision
        console.log(`Created asset for ${wallet.blockchain}:`, {
          symbol: asset.symbol,
          amount: asset.amount,
          stringAmount: asset.amount.toFixed(12),
          value: asset.value,
          isNonZero: asset.amount > 0
        });
        
        return asset;
      });
      
      // Log all processed assets - focusing on non-zero balances with 12 decimal precision
      const nonZeroAssets = processedAssets.filter(a => a.amount > 0);
      if (nonZeroAssets.length > 0) {
        console.log(`Found ${nonZeroAssets.length} assets with non-zero balances:`, 
          nonZeroAssets.map(a => ({
            symbol: a.symbol, 
            blockchain: a.blockchain,
            amount: a.amount,
            stringAmount: a.amount.toFixed(12)
          }))
        );
      } else {
        console.log('No assets with non-zero balances found');
      }
      
      // Sort assets - native tokens first, then by value
      return processedAssets.sort((a, b) => {
        // First sort by non-zero balance (non-zero first)
        if (a.amount > 0 && b.amount === 0) return -1;
        if (a.amount === 0 && b.amount > 0) return 1;
        
        // Then native tokens first
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
