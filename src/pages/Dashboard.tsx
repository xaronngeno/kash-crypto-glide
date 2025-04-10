import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { KashButton } from '@/components/ui/KashButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { prices, loading: pricesLoading, error: pricesError, refetch: refetchPrices } = useCryptoPrices();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { 
    assets, 
    loading: walletLoading, 
    isCreatingWallets, 
    error: walletError,
    createWallets,
    refreshWallets
  } = useWallets({ prices });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  useEffect(() => {
    console.log('Auth state:', { 
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.numeric_id,
      phoneNumbers: profile?.phone_numbers,
      phone: profile?.phone,
      kycStatus: profile?.kyc_status,
      isAuthenticated
    });

    if (!walletLoading && assets.length === 0) {
      console.warn('Wallet assets loaded but empty. No wallets created or issue with data?');
    } else if (!walletLoading) {
      console.log(`Loaded ${assets.length} assets for user`);
    }

    if (isCreatingWallets) {
      toast({
        title: 'Setting up your wallet',
        description: 'We\'re creating your wallets. This may take a moment...',
        duration: 5000,
      });
    }

    if (walletError) {
      console.error('Wallet loading error:', walletError);
    }
    
    if (pricesError) {
      console.error('Price loading error:', pricesError);
    }
  }, [user, profile, assets, walletLoading, isCreatingWallets, walletError, pricesError, toast, isAuthenticated]);

  useEffect(() => {
    const createWalletsIfNeeded = async () => {
      if (!walletLoading && user?.id && !isCreatingWallets) {
        if (assets.length === 0) {
          console.log('No wallets found, attempting to create them automatically');
          await createWallets();
        } else {
          const mainCurrencies = ['BTC', 'ETH', 'SOL', 'MONAD', 'TRX', 'SUI'];
          const existingCurrencies = new Set(assets.map(asset => asset.symbol));
          const missingCurrencies = mainCurrencies.filter(currency => !existingCurrencies.has(currency));
          
          if (missingCurrencies.length > 0) {
            console.log(`Missing main currencies: ${missingCurrencies.join(', ')}. Recreating wallets.`);
            toast({
              title: 'Updating wallets',
              description: `Creating missing wallets: ${missingCurrencies.join(', ')}`,
              duration: 3000,
            });
            await createWallets();
          }
        }
      }
    };
    
    createWalletsIfNeeded();
  }, [walletLoading, assets, user?.id, isCreatingWallets, createWallets]);

  if (authLoading) {
    return (
      <MainLayout title="Portfolio">
        <div className="flex h-64 items-center justify-center flex-col">
          <Loader2 className="h-12 w-12 animate-spin text-kash-green mb-4" />
          <p className="text-gray-500">Verifying your account...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <MainLayout title="Portfolio">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 mb-4">Please log in to view your portfolio.</p>
          <p className="text-gray-400 text-sm">Redirecting to login...</p>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    if (walletLoading || pricesLoading || isCreatingWallets) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 300);
      
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
    refetchPrices();
    toast({
      title: 'Refreshing data',
      description: 'Attempting to reload your wallet data...',
      duration: 3000,
    });
    
    refreshWallets();
  };

  const handleForceCreate = (): Promise<any> => {
    if (!isCreatingWallets) {
      toast({
        title: 'Creating new wallets',
        description: 'Generating new wallets for your account...',
        duration: 3000,
      });
      return createWallets();
    }
    return Promise.resolve();
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

  const renderErrorMessage = () => {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Wallet Data</AlertTitle>
        <AlertDescription className="flex flex-col">
          <span>{walletError || "Failed to load your wallet data"}</span>
          <div className="flex space-x-2 mt-4">
            <KashButton 
              onClick={handleRetryLoading}
              size="sm"
            >
              Retry Loading
            </KashButton>
            <KashButton 
              onClick={() => handleForceCreate()}
              size="sm"
              variant="outline"
              disabled={isCreatingWallets}
            >
              {isCreatingWallets ? 'Creating...' : 'Create New Wallets'}
            </KashButton>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderNoWalletsMessage = () => {
    if (assets.length === 0 && !isLoading && !isCreatingWallets) {
      return (
        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-100">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>No Wallets Found</AlertTitle>
          <AlertDescription className="flex flex-col">
            <span>You don't have any wallets yet. Create wallets to get started.</span>
            <KashButton 
              onClick={() => handleForceCreate()}
              className="mt-4"
              disabled={isCreatingWallets}
            >
              {isCreatingWallets ? 'Creating Wallets...' : 'Create My Wallets'}
            </KashButton>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
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
          {walletError && renderErrorMessage()}
          
          {renderNoWalletsMessage()}
          
          {assets.length > 0 && (
            <>
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
                  <ActionButtons onForceCreateWallets={handleForceCreate} />
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
            </>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
