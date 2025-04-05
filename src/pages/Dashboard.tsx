
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { PromoCard } from '@/components/dashboard/PromoCard';
import { useWallets } from '@/hooks/useWallets';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

const Dashboard = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const { assets, loading } = useWallets({ prices });

  const totalBalance = assets.reduce((acc, asset) => {
    const value = typeof asset.value === 'number' ? asset.value : 0;
    return acc + value;
  }, 0);

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
          
          <AssetsList assets={assets} currency={currency} />
        </div>
        
        <PromoCard />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
