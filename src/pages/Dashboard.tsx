
import { useState, useEffect } from 'react';
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Get crypto prices
  const { prices, error: pricesError } = useCryptoPrices();
  
  // Get wallet assets
  const { assets, error: walletsError, reload } = useWallets({ prices });
  
  // Combined error state
  const error = pricesError || walletsError;

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  // Calculate total balance
  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshWalletBalances(user.id);
      reload(); // Reload wallet data after refresh
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <MainLayout title="Portfolio">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
