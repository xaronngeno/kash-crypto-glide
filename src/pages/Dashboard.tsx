import React, { useState, useEffect } from 'react';
import { reportDetailedBlockchainBalances } from '@/utils/blockchainConnectors';
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

const isDashboardInitialized = {
  value: false
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [pullToRefreshActive, setPullToRefreshActive] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { prices, error: pricesError } = useCryptoPrices();
  
  const { assets, error: walletsError, reload, loading } = useWallets({ 
    prices,
    skipInitialLoad: isDashboardInitialized.value
  });
  
  const error = pricesError || walletsError;

  useEffect(() => {
    const fetchDetailedBalances = async () => {
      try {
        const balances = await reportDetailedBlockchainBalances();
        console.log('Detailed Blockchain Balances:', balances);
      } catch (error) {
        console.error('Error fetching detailed balances:', error);
      }
    };

    fetchDetailedBalances();
  }, []);

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
            refreshing={refreshing}
          />
          <BalanceDisplay 
            totalBalance={totalBalance}
            currency="USD"
            refreshing={refreshing}
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
