
import { useState, useEffect } from 'react';
import { getBlockchainBalance } from '@/utils/blockchainConnectors';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

// Re-export all wallet-related hooks and functions from the wallet directory
export * from './wallet';

interface UseWalletBalanceProps {
  address?: string;
  blockchain: 'Ethereum' | 'Solana';
  autoFetch?: boolean;
}

interface WalletBalanceResponse {
  balance: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<number>;
}

/**
 * Hook to directly fetch a blockchain wallet balance bypassing the database
 */
export const useWalletBalance = ({
  address,
  blockchain,
  autoFetch = true
}: UseWalletBalanceProps): WalletBalanceResponse => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const fetchBalance = async (walletAddress: string): Promise<number> => {
    if (!walletAddress) {
      return 0;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Directly fetching ${blockchain} balance for address ${walletAddress}`);
      const fetchedBalance = await getBlockchainBalance(walletAddress, blockchain);
      
      console.log(`Fetched balance for ${blockchain}: ${fetchedBalance}`);
      setBalance(fetchedBalance);
      return fetchedBalance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      console.error(`Error fetching ${blockchain} balance:`, errorMessage);
      setError(errorMessage);
      return 0;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to allow manual refresh
  const refresh = async (): Promise<number> => {
    if (!address) {
      setError('No wallet address provided');
      return 0;
    }
    
    toast({
      title: `Checking ${blockchain} balance`,
      description: "Fetching directly from blockchain...",
    });
    
    const updatedBalance = await fetchBalance(address);
    
    if (updatedBalance > 0) {
      toast({
        title: `Found ${blockchain} balance`,
        description: `Balance: ${updatedBalance} ${blockchain === 'Ethereum' ? 'ETH' : 'SOL'}`,
      });
    }
    
    return updatedBalance;
  };
  
  // Auto fetch on mount if address is provided and autoFetch is true
  useEffect(() => {
    if (autoFetch && address) {
      fetchBalance(address);
    }
  }, [address, blockchain, autoFetch]);
  
  return {
    balance,
    loading,
    error,
    refresh
  };
};
