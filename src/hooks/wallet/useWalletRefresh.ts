
import { useCallback } from 'react';
import { CryptoPrices } from '@/hooks/useCryptoPrices';
import { refreshWalletBalances } from '@/hooks/wallet/fetchWalletBalances';

interface UseWalletRefreshProps {
  prices: CryptoPrices;
  setError: (error: string | null) => void;
}

export const useWalletRefresh = ({ prices, setError }: UseWalletRefreshProps) => {
  /**
   * Refresh wallet balances from blockchain explorers
   */
  const refreshWallets = useCallback(async (userId: string) => {
    try {
      console.log('Refreshing wallet balances...');
      await refreshWalletBalances(userId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error refreshing wallets";
      console.error('Error refreshing wallet balances:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [setError]);

  return {
    refreshWallets
  };
};
