
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Repeat, CreditCard, Eye, EyeOff, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { toast } from '@/hooks/use-toast';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  amount: number;
  value: number;
  change: number;
  icon: string;
}

const Dashboard = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletsCreated, setWalletsCreated] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const { user } = useAuth();
  const { prices, loading: pricesLoading } = useCryptoPrices();
  
  const defaultAssetsMap = {
    'BTC': { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 0, amount: 0, value: 0, change: 0, icon: '₿' },
    'ETH': { id: '2', name: 'Ethereum', symbol: 'ETH', price: 0, amount: 0, value: 0, change: 0, icon: 'Ξ' },
    'USDT': { id: '3', name: 'USDT', symbol: 'USDT', price: 1.00, amount: 0, value: 0, change: 0, icon: '₮' },
    'SOL': { id: '4', name: 'Solana', symbol: 'SOL', price: 0, amount: 0, value: 0, change: 0, icon: 'Ѕ' },
    'MATIC': { id: '5', name: 'Polygon', symbol: 'MATIC', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'SUI': { id: '6', name: 'Sui', symbol: 'SUI', price: 0, amount: 0, value: 0, change: 0, icon: 'S' },
    'MONAD': { id: '7', name: 'Monad', symbol: 'MONAD', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'BNB': { id: '8', name: 'Binance Coin', symbol: 'BNB', price: 0, amount: 0, value: 0, change: 0, icon: 'B' },
    'XRP': { id: '9', name: 'XRP', symbol: 'XRP', price: 0, amount: 0, value: 0, change: 0, icon: 'X' },
    'ADA': { id: '10', name: 'Cardano', symbol: 'ADA', price: 0, amount: 0, value: 0, change: 0, icon: 'A' },
    'DOGE': { id: '11', name: 'Dogecoin', symbol: 'DOGE', price: 0, amount: 0, value: 0, change: 0, icon: 'D' },
    'DOT': { id: '12', name: 'Polkadot', symbol: 'DOT', price: 0, amount: 0, value: 0, change: 0, icon: 'P' },
    'LINK': { id: '13', name: 'Chainlink', symbol: 'LINK', price: 0, amount: 0, value: 0, change: 0, icon: 'L' }
  };

  // Create wallets for user if they don't exist
  const createWalletsForUser = async () => {
    if (!user || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Checking if user needs wallets created");
      
      // Check if user already has wallets
      const { data: existingWallets, error: walletCheckError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (walletCheckError) {
        throw walletCheckError;
      }
        
      // If wallets already exist, no need to create new ones
      if (existingWallets && existingWallets.length > 0) {
        console.log("User already has wallets:", existingWallets.length);
        setWalletsCreated(true);
        return;
      }
      
      console.log("Creating wallets for user");

      // Get a fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('Failed to get authentication session: ' + (sessionError?.message || 'No access token'));
      }
      
      // Call the edge function to create wallets with explicit content type
      const response = await fetch("https://hfdaowgithffhelybfve.supabase.co/functions/v1/create-wallets", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGFvd2dpdGhmZmhlbHliZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTEzODYsImV4cCI6MjA1OTI2NzM4Nn0.3bxf_yiII1_GBwKUK8qAW5P-Uot9ony993hYkqBfGEw"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Function returned status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log("Wallets created successfully:", data);
      setWalletsCreated(true);
      toast({
        title: 'Success',
        description: 'Your wallets have been created!',
        variant: 'default'
      });
    } catch (err) {
      console.error("Error creating wallets:", err);
      toast({
        title: 'Error',
        description: 'Failed to create user wallets. Please refresh or try again later.',
        variant: 'destructive'
      });
    } finally {
      setCreatingWallets(false);
    }
  };

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setAssets(prevAssets => 
        prevAssets.map(asset => {
          const priceData = prices[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
              change: priceData.change_24h,
              value: asset.amount * priceData.price
            };
          }
          return asset;
        })
      );
    }
  }, [prices]);

  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Check if user has wallets, if not create them
        if (!walletsCreated && !creatingWallets) {
          await createWalletsForUser();
        }
        
        // Get all wallets for the current user
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) {
          throw walletsError;
        }
        
        console.log("Fetched wallets:", wallets);
        
        // Clone the default assets structure
        const initialAssets: Asset[] = Object.values(defaultAssetsMap).map(asset => ({...asset}));
        
        // Create a map to sum up balances for each currency
        const currencyBalances: Record<string, number> = {};

        if (wallets && wallets.length > 0) {
          // Process each wallet and aggregate balances by currency
          wallets.forEach(wallet => {
            const currency = wallet.currency;
            // Ensure we're working with numbers and handle null/undefined values
            const walletBalance = typeof wallet.balance === 'number' 
              ? wallet.balance 
              : parseFloat(String(wallet.balance)) || 0;
            
            if (!isNaN(walletBalance)) {
              if (!currencyBalances[currency]) {
                currencyBalances[currency] = 0;
              }
              currencyBalances[currency] += walletBalance;
            }
          });
          
          console.log("Aggregated currency balances:", currencyBalances);
          
          // Update assets with the aggregated balances
          const updatedAssets = initialAssets.map(asset => {
            const balance = currencyBalances[asset.symbol] || 0;
            const assetPrice = prices?.[asset.symbol]?.price || asset.price;
            
            return {
              ...asset,
              amount: balance,
              price: assetPrice,
              value: balance * assetPrice
            };
          });
          
          console.log('Updated assets with aggregated balances:', updatedAssets);
          
          setAssets(updatedAssets);
        } else {
          console.log('No wallets found, using default assets with zero amounts');
          setAssets(initialAssets);
        }
      } catch (err) {
        console.error('Error fetching wallets:', err);
        toast({
          title: 'Error',
          description: 'Failed to load wallet data',
          variant: 'destructive'
        });
        setAssets(Object.values(defaultAssetsMap));
      } finally {
        setLoading(false);
      }
    };

    fetchUserAssets();
  }, [user, prices, walletsCreated, creatingWallets]);

  // Just for debugging - log the complete asset state whenever it changes
  useEffect(() => {
    console.log('Current assets state:', assets);
  }, [assets]);

  const totalBalance = assets.reduce((acc, asset) => {
    // Ensure we're dealing with numbers
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

  // Always display all assets, even those with zero balance
  const sortedAssets = [...assets].sort((a, b) => b.value - a.value);

  if (loading || pricesLoading) {
    return (
      <MainLayout title="Portfolio">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Portfolio">
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
          
          <div className="mt-4 grid grid-cols-4 gap-2 w-full">
            <Link to="/receive">
              <KashButton 
                variant="ghost"
                fullWidth
                className="flex-col h-20"
                icon={<ArrowDownRight size={20} className="mb-1" />}
              >
                <span>Receive</span>
              </KashButton>
            </Link>
            <Link to="/send">
              <KashButton
                variant="ghost"
                fullWidth
                className="flex-col h-20"
                icon={<ArrowUpRight size={20} className="mb-1" />}
              >
                <span>Send</span>
              </KashButton>
            </Link>
            <Link to="/swap">
              <KashButton
                variant="ghost"
                fullWidth
                className="flex-col h-20"
                icon={<Repeat size={20} className="mb-1" />}
              >
                <span>Swap</span>
              </KashButton>
            </Link>
            <Link to="/buy">
              <KashButton
                variant="ghost"
                fullWidth
                className="flex-col h-20"
                icon={<CreditCard size={20} className="mb-1" />}
              >
                <span>Buy</span>
              </KashButton>
            </Link>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Assets</h2>
            <button 
              onClick={() => setCurrency(currency === 'USD' ? 'KES' : 'USD')}
              className="text-sm text-kash-green"
            >
              Show in {currency === 'USD' ? 'KES' : 'USD'}
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Display all assets, sorted by value */}
            {sortedAssets.map((asset) => (
              <KashCard key={asset.id} className="hover:bg-kash-lightGray cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold">
                      {asset.icon}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">{asset.name}</h3>
                      <p className="text-sm text-gray-500">
                        {asset.amount.toLocaleString('en-US', { 
                          maximumFractionDigits: asset.symbol === 'BTC' ? 8 : 6,
                          minimumFractionDigits: 0
                        })} {asset.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {currency === 'USD' ? '$' : 'KES '}
                      {(currency === 'USD' ? asset.value : asset.value * 129).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${asset.change >= 0 ? 'text-kash-green' : 'text-kash-error'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </KashCard>
            ))}
          </div>
        </div>
        
        <KashCard className="mt-6 bg-gradient-to-br from-kash-green/10 to-kash-green/5 border-none">
          <div className="text-center p-4">
            <h3 className="font-semibold text-lg mb-2">Coming Soon - Digital Credit Card</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create Your Digital Credit Card. This feature is coming soon! Stay tuned for updates.
            </p>
            <KashButton>Get Notified</KashButton>
          </div>
        </KashCard>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
