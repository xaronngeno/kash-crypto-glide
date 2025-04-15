
import { useState, useEffect, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { prices, error: pricesError } = useCryptoPrices();
  
  const { assets, error: walletsError, reload, loading } = useWallets({ 
    prices,
    skipInitialLoad: isDashboardInitialized.value
  });
  
  const error = pricesError || walletsError;

  // Add debug logging to see what's happening with assets
  useEffect(() => {
    console.log("Dashboard - prices:", prices);
    console.log("Dashboard - assets:", assets);
    
    // Check if we have any Solana wallet with a balance
    const solanaWallets = assets.filter(a => a.blockchain === 'Solana');
    if (solanaWallets.length > 0) {
      console.log("Solana wallets:", solanaWallets);
    }
    
    // Check if we have any assets with amount > 0
    const nonZeroAssets = assets.filter(a => a.amount > 0);
    console.log("Non-zero assets:", nonZeroAssets);
  }, [assets, prices]);

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
      console.log("Starting wallet refresh");
      reload();
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  if (authLoading) {
    return <LoadingState />;
  }

  return (
    <MainLayout title="Portfolio">
      <div className="space-y-6" ref={contentRef}>
        <PullToRefresh 
          onRefresh={handleRefresh}
          pullToRefreshActive={pullToRefreshActive}
          setPullToRefreshActive={setPullToRefreshActive}
          refreshing={refreshing}
        />
        
        <DashboardError error={error} />

        <BalanceDisplay 
          totalBalance={totalBalance}
          currency="USD"
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
          
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
