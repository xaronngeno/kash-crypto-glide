
import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { useAuth } from '@/components/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Asset } from '@/types/assets';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [navigate, isAuthenticated, authLoading]);

  // Fetch crypto prices and wallets directly in the component
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setError(null);
        
        // Fetch crypto prices from edge function
        const { data: pricesData, error: pricesError } = await supabase.functions.invoke('crypto-prices', {
          method: 'GET'
        });
        
        if (pricesError) {
          console.error('Error fetching crypto prices:', pricesError);
          throw new Error('Unable to load cryptocurrency prices');
        }
        
        const prices = pricesData?.prices || {};
        
        // Fetch wallet balances from edge function
        const { data: walletsData, error: walletsError } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (walletsError) {
          console.error('Error fetching wallets:', walletsError);
          throw new Error('Unable to load wallet information');
        }
        
        if (!walletsData?.wallets || walletsData.wallets.length === 0) {
          console.log('No wallets found or empty wallets response');
          setAssets([]);
          return;
        }
        
        // Process wallet data directly
        const wallets = walletsData.wallets;
        console.log('Wallets data:', wallets);
        
        // Group wallets by currency
        const currencyNetworkBalances: Record<string, { 
          totalBalance: number, 
          networks: Record<string, { address: string, balance: number }>
        }> = {};

        wallets.forEach(wallet => {
          const { currency, blockchain, address, balance: walletBalance } = wallet;
          const balance = typeof walletBalance === 'number' 
            ? walletBalance 
            : parseFloat(String(walletBalance)) || 0;
          
          if (!isNaN(balance)) {
            // Initialize currency entry if it doesn't exist
            if (!currencyNetworkBalances[currency]) {
              currencyNetworkBalances[currency] = { 
                totalBalance: 0, 
                networks: {} 
              };
            }
            
            // Add to total balance for this currency
            currencyNetworkBalances[currency].totalBalance += balance;
            
            // Add network-specific data
            currencyNetworkBalances[currency].networks[blockchain] = {
              address,
              balance
            };
          }
        });
        
        // Convert to assets array
        const processedAssets: Asset[] = [];
        
        Object.entries(currencyNetworkBalances).forEach(([symbol, data]) => {
          const priceData = prices[symbol];
          const assetPrice = priceData?.price || 0;
          
          processedAssets.push({
            id: symbol,
            name: symbol,
            symbol: symbol,
            price: assetPrice,
            amount: data.totalBalance,
            value: data.totalBalance * assetPrice,
            change: priceData?.change_24h || 0,
            icon: symbol[0],
            networks: data.networks || {}
          });
        });
        
        // Sort by value (highest first)
        processedAssets.sort((a, b) => b.value - a.value);
        setAssets(processedAssets);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        console.error('Error in data fetching:', errorMessage);
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };
    
    fetchData();
    
    // Set up interval to refresh data
    const intervalId = setInterval(fetchData, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Calculate total balance
  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

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
          
          <AssetsList assets={assets} currency={currency} />
        </div>
        
        <PromoCard />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
