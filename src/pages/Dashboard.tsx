
import React, { useState, useEffect, useCallback } from 'react';
import { reportDetailedBlockchainBalances, forceRefreshBlockchainBalance } from '@/utils/blockchainConnectors';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useWallets } from '@/hooks/useWallets';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { BalanceDisplay } from '@/components/dashboard/BalanceDisplay';
import { PullToRefresh } from '@/components/dashboard/PullToRefresh';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { LoadingState } from '@/components/dashboard/LoadingState';
import { AssetsSection } from '@/components/dashboard/AssetsSection';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { toast } from '@/hooks/use-toast';

const isDashboardInitialized = {
  value: false
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [pullToRefreshActive, setPullToRefreshActive] = useState(false);
  const [forceRefreshTriggered, setForceRefreshTriggered] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { prices, error: pricesError } = useCryptoPrices();
  
  const { assets, error: walletsError, reload, loading } = useWallets({ 
    prices,
    skipInitialLoad: isDashboardInitialized.value
  });
  
  const error = pricesError || walletsError;

  // Add direct blockchain balance check
  const forceRefreshBalances = useCallback(async () => {
    try {
      setForceRefreshTriggered(true);
      toast({
        title: "Refreshing from blockchain",
        description: "Fetching latest balances directly from blockchain...",
      });
      
      // Find Solana and Ethereum wallets
      const solWallet = assets.find(a => a.blockchain === 'Solana' && a.symbol === 'SOL');
      const ethWallet = assets.find(a => a.blockchain === 'Ethereum' && a.symbol === 'ETH');
      
      let updatedBalances = {};
      
      if (solWallet?.address) {
        const solBalance = await forceRefreshBlockchainBalance(
          solWallet.address, 
          'Solana'
        );
        
        updatedBalances = { 
          ...updatedBalances, 
          solana: {
            address: solWallet.address,
            balance: solBalance,
            hadBalance: solBalance > 0
          }
        };
        
        console.log(`Force refreshed SOL balance: ${solBalance}`);
      }
      
      if (ethWallet?.address) {
        const ethBalance = await forceRefreshBlockchainBalance(
          ethWallet.address, 
          'Ethereum'
        );
        
        updatedBalances = { 
          ...updatedBalances, 
          ethereum: {
            address: ethWallet.address,
            balance: ethBalance,
            hadBalance: ethBalance > 0
          }
        };
        
        console.log(`Force refreshed ETH balance: ${ethBalance}`);
      }

      // Show results
      console.log("Force-refreshed blockchain balances:", updatedBalances);
      
      toast({
        title: "Blockchain check complete",
        description: "Reloading your wallet data with latest balances...",
      });
      
      // Now reload the wallet data to update UI
      reload();
      
    } catch (error) {
      console.error("Error force-refreshing balances:", error);
      toast({
        title: "Refresh error",
        description: "There was an error checking blockchain balances directly",
        variant: "destructive"
      });
    } finally {
      setForceRefreshTriggered(false);
    }
  }, [assets, reload]);

  useEffect(() => {
    const fetchDetailedBalances = async () => {
      try {
        const balances = await reportDetailedBlockchainBalances();
        console.log('Detailed Blockchain Balances:', balances);
        
        // If we detect non-zero balances in the blockchain but show zero in the app
        const solWallet = assets.find(a => a.blockchain === 'Solana' && a.symbol === 'SOL');
        if (balances.solana > 0 && solWallet?.amount === 0 && !forceRefreshTriggered) {
          console.log("Balance mismatch detected - blockchain shows balance but app shows zero");
          toast({
            title: "Balance update needed",
            description: "Your blockchain balance may need refreshing",
            action: (
              <button 
                onClick={forceRefreshBalances}
                className="bg-kash-green text-white px-3 py-1 rounded-md text-xs"
              >
                Refresh Now
              </button>
            )
          });
        }
      } catch (error) {
        console.error('Error fetching detailed balances:', error);
      }
    };

    if (assets.length > 0 && !loading) {
      fetchDetailedBalances();
    }
  }, [assets, loading, forceRefreshBalances, forceRefreshTriggered]);
  
  // Add detailed logging for asset balances
  useEffect(() => {
    if (assets.length > 0) {
      console.log("Dashboard - Assets with details:");
      assets.forEach(asset => {
        const solanaAsset = asset.blockchain === 'Solana';
        const ethereumAsset = asset.blockchain === 'Ethereum';
        
        if (solanaAsset) {
          console.log("Solana asset details:", {
            symbol: asset.symbol,
            blockchain: asset.blockchain,
            address: asset.address,
            amount: asset.amount,
            exactAmount: asset.amount.toFixed(12),
            hasValue: asset.amount > 0
          });
        }
        
        if (ethereumAsset) {
          console.log("Ethereum asset details:", {
            symbol: asset.symbol,
            blockchain: asset.blockchain,
            address: asset.address,
            amount: asset.amount,
            exactAmount: asset.amount.toFixed(12),
            hasValue: asset.amount > 0
          });
        }
      });
    }
  }, [assets]);

  useEffect(() => {
    if (assets.length > 0 && !isDashboardInitialized.value) {
      console.log("Setting dashboard as initialized");
      isDashboardInitialized.value = true;
    }
  }, [assets]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to auth");
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    
    setRefreshing(true);
    try {
      console.log("Starting wallet refresh from pull-to-refresh");
      reload();
      // Add direct blockchain check on manual refresh
      forceRefreshBalances();
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 1500); // Give more time for the refresh animation
    }
  };

  if (authLoading) {
    return <LoadingState />;
  }

  return (
    <MainLayout title="Portfolio">
      <div className="space-y-6">
        <DashboardError error={error} />

        <div>
          <PullToRefresh 
            onRefresh={handleRefresh}
            pullToRefreshActive={pullToRefreshActive}
            setPullToRefreshActive={setPullToRefreshActive}
            refreshing={refreshing || forceRefreshTriggered}
          />
          <BalanceDisplay 
            totalBalance={totalBalance}
            currency="USD"
            refreshing={refreshing || forceRefreshTriggered}
            onRefresh={handleRefresh}
          />
        </div>
          
        <div className="mt-4">
          <ActionButtons />
        </div>

        <AssetsSection 
          assets={assets}
          loading={loading}
        />
        
        <PromoCard />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
