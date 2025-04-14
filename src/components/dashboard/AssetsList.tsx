
import { memo } from 'react';
import { Asset } from '@/types/assets';
import Image from '@/components/ui/Image';
import { KashCard } from '@/components/ui/KashCard';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetsListProps {
  assets: Asset[];
  currency: string;
}

export const AssetsList = memo(({ assets, currency }: AssetsListProps) => {
  // Group assets by blockchain
  const groupedAssets = assets.reduce((groups, asset) => {
    const blockchain = asset.blockchain || 'Other';
    if (!groups[blockchain]) {
      groups[blockchain] = [];
    }
    groups[blockchain].push(asset);
    return groups;
  }, {} as Record<string, Asset[]>);
  
  // Sort blockchains with Ethereum and Solana first
  const sortedBlockchains = Object.keys(groupedAssets).sort((a, b) => {
    if (a === 'Ethereum') return -1;
    if (b === 'Ethereum') return 1;
    if (a === 'Solana') return -1;
    if (b === 'Solana') return 1;
    return a.localeCompare(b);
  });
  
  const getExplorerUrl = (asset: Asset) => {
    if (!asset.address) return null;
    
    if (asset.blockchain === 'Ethereum') {
      return `https://etherscan.io/address/${asset.address}`;
    } else if (asset.blockchain === 'Solana') {
      return `https://solscan.io/account/${asset.address}`;
    }
    return null;
  };
  
  const getTokenLabel = (asset: Asset) => {
    if (asset.walletType === 'native') {
      return asset.blockchain;
    } else if (asset.tokenStandard === 'ERC20') {
      return 'ERC-20';
    } else if (asset.tokenStandard === 'SPL') {
      return 'SPL';
    }
    return asset.walletType || '';
  };
  
  return (
    <div className="space-y-1">
      {sortedBlockchains.map(blockchain => (
        <div key={blockchain} className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 px-2 mb-1">
            {blockchain}
          </h3>
          
          <KashCard variant="outline" padding="none" className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {groupedAssets[blockchain].map((asset, index) => (
                <div 
                  key={asset.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors cursor-pointer px-4 py-3"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mr-3">
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
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium">{asset.name}</h3>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {getTokenLabel(asset)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {asset.amount.toLocaleString('en-US', { 
                            maximumFractionDigits: 6,
                            minimumFractionDigits: 0
                          })} {asset.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-2">
                        <p className="font-medium">
                          {currency === 'USD' ? '$' : 'KES '}
                          {(currency === 'USD' ? asset.value : asset.value * 129).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm ${asset.change >= 0 ? 'text-kash-green' : 'text-kash-error'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </KashCard>
        </div>
      ))}
      
      {assets.length === 0 && (
        <div className="text-center py-8 text-gray-500 mt-4">
          <p>No assets found. Add Ethereum or Solana to get started.</p>
          <p className="text-sm mt-2">Tokens sent to your addresses will appear here automatically.</p>
        </div>
      )}
    </div>
  );
});
