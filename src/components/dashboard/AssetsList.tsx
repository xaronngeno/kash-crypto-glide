import { memo } from 'react';
import { KashCard } from '@/components/ui/KashCard';
import { Asset } from '@/types/assets';
import Image from '@/components/ui/Image';
import { ExternalLink } from 'lucide-react';

interface AssetsListProps {
  assets: Asset[];
  currency: string;
}

export const AssetsList = memo(({ assets, currency }: AssetsListProps) => {
  const formatAddress = (address: string): string => {
    if (!address || address === 'Address Not Available') return 'Address Not Available';
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-3">
      {assets.map((asset) => (
        <KashCard key={asset.id} className="hover:bg-kash-lightGray cursor-pointer transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {asset.logo ? (
                  <Image 
                    src={asset.logo} 
                    alt={asset.name} 
                    className="w-full h-full object-cover" 
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = `/coins/${asset.symbol.toLowerCase()}.png`;
                      e.target.onerror = () => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML = `<div class="text-xl font-bold">${asset.icon}</div>`;
                      };
                    }}
                  />
                ) : (
                  <div className="text-xl font-bold">{asset.icon}</div>
                )}
              </div>
              <div className="ml-3">
                <div className="flex items-center gap-1">
                  <h3 className="font-medium">{asset.name}</h3>
                </div>
                <p className="text-sm text-gray-500 flex flex-col">
                  <span>
                    {asset.amount.toLocaleString('en-US', { 
                      maximumFractionDigits: asset.symbol === 'BTC' ? 8 : 6,
                      minimumFractionDigits: 0
                    })} {asset.symbol}
                  </span>
                  <span className="text-xs text-gray-400">{formatAddress(asset.address)}</span>
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
