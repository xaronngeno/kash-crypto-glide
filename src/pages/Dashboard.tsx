
import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { useWallets } from '@/hooks/useWallets';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const { user, profile } = useAuth();
  const { assets, loading, isCreatingWallets } = useWallets({ prices });

  // Debug logging for user and wallet relationship
  useEffect(() => {
    // Log auth and profile info
    console.log('Auth state:', { 
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.numeric_id,
      phoneNumbers: profile?.phone_numbers,
      phone: profile?.phone,
      kycStatus: profile?.kyc_status
    });

    // If assets loaded but empty
    if (!loading && assets.length === 0) {
      console.warn('Wallet assets loaded but empty. No wallets created or issue with data?');
    } else if (!loading) {
      console.log(`Loaded ${assets.length} assets for user`);
    }

    // Alert user if wallets are being created
    if (isCreatingWallets) {
      toast({
        title: 'Setting up your wallet',
        description: 'We\'re creating your wallets. This may take a moment...',
        duration: 5000,
      });
    }
  }, [user, profile, assets, loading, isCreatingWallets]);

  // Loading progress effect
  useEffect(() => {
    if (loading || pricesLoading || isCreatingWallets) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Cap at 90% until fully loaded
          if (prev >= 90) return 90;
          return prev + 5;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [loading, pricesLoading, isCreatingWallets]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center pt-4">
        <div className="text-gray-500 text-sm mb-1">Total Balance</div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 w-full">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Your Assets</h2>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Portfolio">
      {(loading || pricesLoading || isCreatingWallets) && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-kash-green mr-2" />
            <p className="text-sm text-gray-500">
              {isCreatingWallets 
                ? "Setting up your wallets..." 
                : "Loading your portfolio..."}
            </p>
          </div>
          
          <div className="px-4 w-full">
            <Progress 
              value={loadingProgress} 
              className="h-2 bg-gray-100"
            />
            <p className="text-xs text-center mt-1 text-gray-400">
              {loadingProgress < 100 
                ? "This may take a few moments on first login" 
                : "Almost there!"}
            </p>
          </div>
          
          {renderLoadingSkeleton()}
        </div>
      )}

      {!loading && !pricesLoading && !isCreatingWallets && (
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
              <div className="flex-grow"></div>
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
                <p className="text-gray-500">No assets found. We're setting up your wallets...</p>
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
