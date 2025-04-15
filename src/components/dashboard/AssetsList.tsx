
import { memo, useEffect } from 'react';
import { Asset } from '@/types/assets';
import Image from '@/components/ui/Image';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssetsListProps {
  assets: Asset[];
  currency: string;
}

export const AssetsList = memo(({ assets, currency }: AssetsListProps) => {
  const navigate = useNavigate();
  
  // Debug log when assets change
  useEffect(() => {
    console.log("Assets in AssetsList:", assets);
    
    // Check for any assets with non-zero amounts
    const nonZeroAssets = assets.filter(asset => asset.amount > 0);
    console.log("Assets with non-zero amounts:", nonZeroAssets);
    
    // Log Solana assets specifically 
    const solanaAssets = assets.filter(asset => asset.blockchain === 'Solana');
    console.log("Solana assets:", solanaAssets);
    
    // Log Ethereum assets
    const ethereumAssets = assets.filter(asset => asset.blockchain === 'Ethereum');
    console.log("Ethereum assets:", ethereumAssets);
    
    // Log individual asset amounts for debugging
    assets.forEach(asset => {
      console.log(`Asset ${asset.symbol} details:`, {
        amount: asset.amount,
        type: typeof asset.amount,
        value: asset.value,
        exactAmount: asset.amount.toString(),
        isNonZero: asset.amount > 0
      });
    });
  }, [assets]);
  
  const sortedAssets = [...assets].sort((a, b) => {
    // Sort by non-zero amount first
    if (a.amount > 0 && b.amount === 0) return -1;
    if (a.amount === 0 && b.amount > 0) return 1;
    // Then by value
    return b.value - a.value;
  });
  
  const getTokenLabel = (asset: Asset) => {
    if (asset.walletType === 'native') {
      return asset.blockchain;
    } else if (asset.tokenStandard === 'ERC20') {
      return 'ERC-20';
    } else if (asset.tokenStandard === 'SPL') {
      return 'SPL';
    }
    return '';
  };
  
  const handleAssetClick = (asset: Asset) => {
    navigate(`/coin/${asset.symbol.toLowerCase()}`);
  };
  
  // Format balance with appropriate decimal places based on the value
  const formatTokenAmount = (amount: number, symbol: string) => {
    if (amount === 0) return '0';
    
    // Show more decimals for smaller values to ensure visibility
    if (amount < 0.0001) return amount.toFixed(9); // Show tiny balances with high precision
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    
    return amount.toLocaleString('en-US', { 
      maximumFractionDigits: 6,
      minimumFractionDigits: 0
    });
  };
  
  return (
    <div className="space-y-2">
      {sortedAssets.length > 0 ? (
        sortedAssets.map((asset) => (
          <div 
            key={asset.id}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 cursor-pointer"
            onClick={() => handleAssetClick(asset)}
          >
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
                  {asset.walletType !== 'native' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {getTokenLabel(asset)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatTokenAmount(asset.amount, asset.symbol)} {asset.symbol}
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
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 mt-4">
          <p>No assets found. Add Ethereum or Solana to get started.</p>
          <p className="text-sm mt-2">Tokens sent to your addresses will appear here automatically.</p>
        </div>
      )}
    </div>
  );
});
