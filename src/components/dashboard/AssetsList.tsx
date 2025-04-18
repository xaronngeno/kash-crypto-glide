import { memo, useEffect } from 'react';
import { Asset } from '@/types/assets';
import Image from '@/components/ui/Image';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { forceRefreshBlockchainBalance } from '@/utils/blockchainConnectors';

interface AssetsListProps {
  assets: Asset[];
  currency: string;
}

export const AssetsList = memo(({ assets, currency }: AssetsListProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("Assets in AssetsList:", assets);
    
    const nonZeroAssets = assets.filter(asset => asset.amount > 0);
    console.log("Assets with non-zero amounts:", nonZeroAssets);
    
    const solanaAssets = assets.filter(asset => asset.blockchain === 'Solana');
    console.log("Solana assets:", solanaAssets);
    
    const ethereumAssets = assets.filter(asset => asset.blockchain === 'Ethereum');
    console.log("Ethereum assets:", ethereumAssets);
    
    assets.forEach(asset => {
      console.log(`Asset ${asset.symbol} details:`, {
        amount: asset.amount,
        type: typeof asset.amount,
        value: asset.value,
        exactAmount: asset.amount.toFixed(12),
        isNonZero: asset.amount > 0
      });
    });
  }, [assets]);
  
  const sortedAssets = [...assets].sort((a, b) => {
    if (a.amount > 0 && b.amount === 0) return -1;
    if (a.amount === 0 && b.amount > 0) return 1;
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
  
  const refreshAssetBalance = async (asset: Asset, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!asset.address) {
      toast({
        title: "Cannot refresh",
        description: "No valid address available for this asset",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: `Refreshing ${asset.symbol}`,
      description: "Checking blockchain directly...",
    });
    
    try {
      const balance = await forceRefreshBlockchainBalance(
        asset.address,
        asset.blockchain as 'Ethereum' | 'Solana'
      );
      
      console.log(`Directly checked ${asset.blockchain} balance:`, {
        asset: asset.symbol,
        address: asset.address,
        fetchedBalance: balance,
        currentBalance: asset.amount,
        difference: balance - asset.amount,
        hasBalanceChanged: balance !== asset.amount
      });
      
      if (balance > 0 && asset.amount === 0) {
        toast({
          title: "Balance found!",
          description: `Found ${balance} ${asset.symbol} on blockchain! Please reload the app to update.`,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="bg-kash-green text-white px-3 py-1 rounded-md text-xs"
            >
              Reload
            </button>
          )
        });
      } else if (balance !== asset.amount) {
        toast({
          title: "Balance updated",
          description: `Found ${balance} ${asset.symbol} on blockchain! Please reload the app to update.`,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="bg-kash-green text-white px-3 py-1 rounded-md text-xs"
            >
              Reload
            </button>
          )
        });
      } else {
        toast({
          title: "Balance verified",
          description: `Your ${asset.symbol} balance is up to date!`,
        });
      }
    } catch (error) {
      console.error(`Error refreshing ${asset.symbol} balance:`, error);
      toast({
        title: "Refresh failed",
        description: "Could not check blockchain balance",
        variant: "destructive"
      });
    }
  };
  
  const formatTokenAmount = (amount: number, symbol: string) => {
    if (amount === 0) return '0';
    
    if (amount > 0 && amount < 0.000001) {
      return amount.toFixed(12).replace(/\.?0+$/, '');
    }
    
    const formattedAmount = amount.toFixed(9).replace(/\.?0+$/, '');
    return formattedAmount;
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
              <button 
                onClick={(e) => refreshAssetBalance(asset, e)}
                className="mr-2 p-1 hover:bg-gray-100 rounded-full"
                title="Refresh balance from blockchain"
              >
                <RefreshCw size={16} className="text-gray-500" />
              </button>
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
      ) : null}
    </div>
  );
});
