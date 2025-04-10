
import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { prices, loading: pricesLoading, error: pricesError, refetch: refetchPrices } = useCryptoPrices();
  const { user, profile } = useAuth();
  const { 
    assets, 
    loading: walletLoading, 
    isCreatingWallets, 
    error: walletError 
  } = useWallets({ prices });

  // Debug logging for user and wallet relationship
  useEffect(() => {
    // Log auth state
    console.log('Auth state:', { 
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.numeric_id,
      phoneNumbers: profile?.phone_numbers,
      phone: profile?.phone,
      kycStatus: profile?.kyc_status
    });

    if (!walletLoading && assets.length === 0) {
      console.warn('Wallet assets loaded but empty. No wallets created or issue with data?');
      toast({
        title: 'Showing demo wallets',
        description: 'We\'re showing you demo wallet data.',
        variant: 'default',
        duration: 5000,
      });
    } else if (!walletLoading) {
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

    // Show info toast if there's an error but we're showing demo data
    if (walletError) {
      console.log('Using demo wallet data:', walletError);
    }
    
    // Show info toast if there's a price loading error
    if (pricesError) {
      console.log('Using estimated price data:', pricesError);
    }
  }, [user, profile, assets, walletLoading, isCreatingWallets, walletError, pricesError, toast]);

  // Simple loading progress effect
  useEffect(() => {
    if (walletLoading || pricesLoading || isCreatingWallets) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10; // Faster progress
        });
      }, 300); // Shorter interval
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [walletLoading, pricesLoading, isCreatingWallets]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  const isLoading = (walletLoading || pricesLoading || isCreatingWallets);

  const handleRetryLoading = () => {
    // Try to refetch data
    refetchPrices();
    toast({
      title: 'Refreshing data',
      description: 'Attempting to reload your wallet data...',
      duration: 3000,
    });
    // Force page reload if things are really stuck
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );

  const renderInfoMessage = () => {
    return (
      <Alert variant="default" className="mb-6 bg-blue-50 border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle>Demo Mode</AlertTitle>
        <AlertDescription className="flex flex-col">
          <span>Showing demo wallet data with sample balances.</span>
          <button 
            onClick={handleRetryLoading}
            className="text-sm mt-2 underline text-left text-blue-500"
          >
            Reload data
          </button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <MainLayout title="Portfolio">
      {isLoading && (
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
          </div>
          
          {renderLoadingSkeleton()}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {(walletError || pricesError) && renderInfoMessage()}
          
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
