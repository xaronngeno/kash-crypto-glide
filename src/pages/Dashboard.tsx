
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Repeat, CreditCard, Eye, EyeOff, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

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
  const { user } = useAuth();
  const { prices, loading: pricesLoading } = useCryptoPrices();
  
  // Default assets with initial price and zero balance
  const defaultAssets = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 0, amount: 0, value: 0, change: 0, icon: '₿' },
    { id: '2', name: 'Ethereum', symbol: 'ETH', price: 0, amount: 0, value: 0, change: 0, icon: 'Ξ' },
    { id: '3', name: 'USDT', symbol: 'USDT', price: 1.00, amount: 0, value: 0, change: 0, icon: '₮' },
    { id: '4', name: 'Solana', symbol: 'SOL', price: 0, amount: 0, value: 0, change: 0, icon: 'Ѕ' },
  ];

  // Update assets when prices change
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
        
        // Get the user's wallets from the database
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) {
          throw walletsError;
        }
        
        // If no wallets found, use default assets with zero amounts
        if (!wallets || wallets.length === 0) {
          setAssets(defaultAssets);
          setLoading(false);
          return;
        }
        
        // Map wallet data to assets
        const userAssets = defaultAssets.map(defaultAsset => {
          const wallet = wallets.find(w => w.currency === defaultAsset.symbol);
          
          if (wallet) {
            return {
              ...defaultAsset,
              amount: wallet.balance,
              // We'll update price and value when we get real-time data
              value: wallet.balance * defaultAsset.price
            };
          }
          
          return defaultAsset;
        });
        
        setAssets(userAssets);
      } catch (err) {
        console.error('Error fetching wallets:', err);
        setError('Failed to load wallet data');
        setAssets(defaultAssets);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAssets();
  }, [user]);

  const totalBalance = assets.reduce((acc, asset) => acc + asset.value, 0);

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
        {/* Balance Section */}
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

        {/* Assets List */}
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
            {assets.map((asset) => (
              <KashCard key={asset.id} className="hover:bg-kash-lightGray cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold">
                      {asset.icon}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">{asset.name}</h3>
                      <p className="text-sm text-gray-500">{asset.amount} {asset.symbol}</p>
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
        
        {/* Coming Soon Section */}
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
