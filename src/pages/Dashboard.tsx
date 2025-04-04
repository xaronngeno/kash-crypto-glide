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
  const [walletsCreated, setWalletsCreated] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const { user, session } = useAuth();
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

  const createWalletsForUser = async () => {
    if (!user || !session?.access_token || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Creating wallets for user");
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-wallets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating wallets: Status ${response.status}`, errorText);
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
      if (!user || !session?.access_token) return;
      
      try {
        setLoading(true);
        
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) {
          throw walletsError;
        }
        
        console.log("Fetched wallets:", wallets);
        
        if (!wallets || wallets.length === 0) {
          if (!walletsCreated && !creatingWallets) {
            await createWalletsForUser();
            
            const { data: newWallets, error: newWalletsError } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', user.id);
              
            if (newWalletsError) {
              throw newWalletsError;
            }
            
            if (newWallets && newWallets.length > 0) {
              processWallets(newWallets);
              return;
            }
          }
        } else {
          processWallets(wallets);
          return;
        }
        
        console.log('No wallets found, using default assets with zero amounts');
        setAssets(Object.values(defaultAssetsMap));
        
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

    const processWallets = (wallets: any[]) => {
      const initialAssets = Object.values(defaultAssetsMap).map(asset => ({...asset}));
      
      const currencyBalances: Record<string, number> = {};

      wallets.forEach(wallet => {
        const currency = wallet.currency;
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
    };

    fetchUserAssets();
  }, [user, prices, session, walletsCreated, creatingWallets]);

  useEffect(() => {
    console.log('Current assets state:', assets);
  }, [assets]);

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

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
