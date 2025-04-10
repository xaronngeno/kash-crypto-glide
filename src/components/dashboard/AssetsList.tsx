
import { memo } from 'react';
import { KashCard } from '@/components/ui/KashCard';
import { Asset } from '@/types/assets';

interface AssetsListProps {
  assets: Asset[];
  currency: string;
}

export const AssetsList = memo(({ assets, currency }: AssetsListProps) => {
  // We're already sorting in the useWallets hook, so no need to sort again
  
  return (
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
  );
});
