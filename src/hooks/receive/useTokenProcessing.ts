
import { useState, useEffect } from 'react';
import { Token } from '@/types/token';
import { WalletAddress } from '@/types/wallet';
import { getCurrencyLogo } from '@/utils/currencyUtils';

export const useTokenProcessing = (walletAddresses: WalletAddress[]) => {
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (walletAddresses.length > 0) {
      console.log("Processing wallet addresses:", walletAddresses);
      
      const tokenMap = new Map<string, Token>();
      
      walletAddresses.forEach(wallet => {
        const existingToken = tokenMap.get(wallet.symbol);
        
        if (existingToken) {
          if (!existingToken.networks?.includes(wallet.blockchain)) {
            existingToken.networks = [...(existingToken.networks || []), wallet.blockchain];
          }
          
          tokenMap.set(wallet.symbol, existingToken);
        } else {
          tokenMap.set(wallet.symbol, {
            id: wallet.symbol,
            name: wallet.symbol,
            symbol: wallet.symbol,
            icon: wallet.symbol[0],
            decimals: wallet.symbol === 'SOL' ? 9 : 18,
            logo: getCurrencyLogo(wallet.symbol),
            networks: [wallet.blockchain]
          });
        }
      });
      
      const processedTokens = Array.from(tokenMap.values());
      console.log("Processed tokens:", processedTokens);
      setAvailableTokens(processedTokens);
    }
  }, [walletAddresses]);

  return { availableTokens };
};
