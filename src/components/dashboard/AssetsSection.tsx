
import { useState } from 'react';
import { Asset } from '@/types/assets';
import { AssetsList } from './AssetsList';

interface AssetsSectionProps {
  assets: Asset[];
  loading: boolean;
}

export const AssetsSection = ({ assets, loading }: AssetsSectionProps) => {
  const [currency, setCurrency] = useState('USD');

  return (
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
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kash-green"></div>
        </div>
      ) : (
        <AssetsList assets={assets} currency={currency} />
      )}
    </div>
  );
};
