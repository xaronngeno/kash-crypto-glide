
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { useWallets } from '@/hooks/useWallets';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { assets, loading: walletLoading } = useWallets({ prices });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  const isLoading = (walletLoading || pricesLoading);

  return (
    <MainLayout title="Portfolio">
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="text-gray-500 text-sm mb-1">Total Balance</div>
            <Skeleton className="h-8 w-48" />
            <div className="mt-4 w-full">
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Your Assets</h2>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="text-gray-500 text-sm mb-1">Total Balance</div>
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
            
            {assets.length > 0 ? (
              <AssetsList assets={assets} currency={currency} />
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Setting up your wallets, please wait...</p>
              </div>
            )}
          </div>
          
          <PromoCard />
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;

