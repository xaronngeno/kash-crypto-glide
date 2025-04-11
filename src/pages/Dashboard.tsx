
import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { useAuth } from '@/components/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useWallets } from '@/hooks/useWallets';
import { refreshWalletBalances } from '@/hooks/useWalletBalance';
import { KashButton } from '@/components/ui/KashButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [refreshing, setRefreshing] = useState(false);
  const [pullToRefreshActive, setPullToRefreshActive] = useState(false);
  const pullStartY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { prices, error: pricesError } = useCryptoPrices();
  
  // Only skip initial load if we're not on first mount - manage this with sessionStorage
  const isFirstLoad = !sessionStorage.getItem('dashboardLoaded');
  const { assets, error: walletsError, reload, loading } = useWallets({ 
    prices,
    skipInitialLoad: !isFirstLoad
  });
  
  const error = pricesError || walletsError;

  // Mark dashboard as loaded after first successful load
  useEffect(() => {
    if (!loading && assets.length > 0 && !sessionStorage.getItem('dashboardLoaded')) {
      sessionStorage.setItem('dashboardLoaded', 'true');
    }
  }, [loading, assets]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to auth");
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  // Handle pull-to-refresh gesture
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull to refresh when at top of page
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - pullStartY.current;
      
      // Only activate pull to refresh when pulling down from top of page
      if (window.scrollY === 0 && pullDistance > 50 && !refreshing) {
        setPullToRefreshActive(true);
      }
    };

    const handleTouchEnd = () => {
      if (pullToRefreshActive && !refreshing) {
        handleRefresh();
      }
      setPullToRefreshActive(false);
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove);
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullToRefreshActive, refreshing]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshWalletBalances(user.id);
      reload();
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout title="Portfolio">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kash-green mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your portfolio...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Portfolio">
      <div className="space-y-6" ref={contentRef}>
        {pullToRefreshActive && (
          <div className="flex justify-center py-4 text-kash-green">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kash-green"></div>
            <span className="ml-2">Release to refresh</span>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {typeof error === 'string' ? error : 'Failed to load wallet data. Please try again later.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center pt-4">
          <div className="text-gray-500 text-sm mb-1 flex items-center">
            <span>Total Balance</span>
            <KashButton 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              className="ml-2 h-6 w-6"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </KashButton>
          </div>
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">
              {currency === 'USD' ? '$' : 'KES '}
              {hideBalance ? '•••••' : totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h1>
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="mt-4">
            <ActionButtons />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Your Assets</h2>
            <button 
              onClick={() => setCurrency(currency === 'USD' ? 'KES' : 'USD')}
              className="text-sm text-kash-green"
            >
              Show in {currency === 'USD' ? 'KES' : 'USD'}
            </button>
          </div>
          
          <AssetsList assets={assets} currency={currency} />
        </div>
        
        <PromoCard />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
