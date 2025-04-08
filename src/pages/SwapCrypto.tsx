import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import TokenSelector from '@/components/swap/TokenSelector';
import SwapRateInfo from '@/components/swap/SwapRateInfo';
import SwapConfirmationModal from '@/components/swap/SwapConfirmationModal';
import { Input } from '@/components/ui/input';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  decimals: number;
  icon: string; // Made required to match Token interface
  platform?: {
    name: string;
    logo: string;
  };
  change_24h?: number;
  change_7d?: number;
  change_30d?: number;
}

type TimeFilter = '24h' | '7d' | '30d';
type NetworkFilter = 'All' | 'Ethereum' | 'Solana' | 'Bitcoin' | 'Polygon' | 'Base';
type TokenFilter = 'Trending' | 'All' | 'Favorites';

const SwapCrypto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { prices, loading: pricesLoading } = useCryptoPrices();

  const [assets, setAssets] = useState<CryptoAsset[]>([
    { id: 'usdt', symbol: 'USDT', name: 'Tether', logo: '/usdt-logo.png', price: 1.00, decimals: 6, icon: '/usdt-logo.png' },
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', logo: '/btc-logo.png', price: 60000, decimals: 8, icon: '/btc-logo.png' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', logo: '/eth-logo.png', price: 3000, decimals: 18, icon: '/eth-logo.png' },
    { id: 'sol', symbol: 'SOL', name: 'Solana', logo: '/sol-logo.png', price: 150, decimals: 9, icon: '/sol-logo.png' },
  ]);

  const [fromToken, setFromToken] = useState<CryptoAsset | null>(null);
  const [toToken, setToToken] = useState<CryptoAsset | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [balances, setBalances] = useState({
    USDT: 1000,
    BTC: 0.01,
    ETH: 0.1,
    SOL: 1,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [networkFee, setNetworkFee] = useState(0.001);
  
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('Trending');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('Solana');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');

  const [trendingTokens, setTrendingTokens] = useState<CryptoAsset[]>([]);

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      const updatedAssets = [...assets];
      
      Object.entries(prices).forEach(([symbol, data]) => {
        const existingAssetIndex = updatedAssets.findIndex(asset => asset.symbol === symbol);
        
        if (existingAssetIndex >= 0) {
          updatedAssets[existingAssetIndex] = {
            ...updatedAssets[existingAssetIndex],
            price: data.price,
            logo: data.logo || updatedAssets[existingAssetIndex].logo,
            icon: data.logo || updatedAssets[existingAssetIndex].icon,
            change_24h: data.change_24h,
          };
        } else {
          updatedAssets.push({
            id: symbol.toLowerCase(),
            symbol: symbol,
            name: data.name || symbol,
            logo: data.logo || '',
            icon: data.logo || symbol.charAt(0),
            price: data.price,
            decimals: 18,
            platform: data.platform,
            change_24h: data.change_24h,
          });
        }
      });
      
      setAssets(updatedAssets);
      
      generateTrendingTokens(updatedAssets, networkFilter, timeFilter);
    }
  }, [prices, networkFilter, timeFilter]);

  const generateTrendingTokens = (allTokens: CryptoAsset[], network: NetworkFilter, time: TimeFilter) => {
    const filtered = allTokens.filter(token => {
      if (network !== 'All' && token.platform?.name !== network) {
        return network === 'Solana' && !token.platform;
      }
      return true;
    });
    
    let sorted: CryptoAsset[];
    
    switch (time) {
      case '24h':
        sorted = filtered.sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0));
        break;
      case '7d':
        sorted = filtered.sort((a, b) => (b.change_7d || 0) - (a.change_7d || 0));
        break;
      case '30d':
        sorted = filtered.sort((a, b) => (b.change_30d || 0) - (a.change_30d || 0));
        break;
      default:
        sorted = filtered.sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0));
    }
    
    setTrendingTokens(sorted.slice(0, 10));
  };

  useEffect(() => {
    if (assets.length > 0 && !fromToken && !toToken) {
      const solToken = assets.find(asset => asset.symbol === 'SOL');
      const usdcToken = assets.find(asset => asset.symbol === 'USDT');
      
      if (solToken) setFromToken(solToken);
      if (usdcToken) setToToken(usdcToken);
    }
  }, [assets, fromToken, toToken]);

  const getExchangeRate = (from: string, to: string): number => {
    const fromAsset = assets.find((asset) => asset.symbol === from);
    const toAsset = assets.find((asset) => asset.symbol === to);

    if (!fromAsset || !toAsset) {
      console.error('Asset not found');
      return 0;
    }

    return fromAsset.price / toAsset.price;
  };

  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      const calculatedAmount = (Number(fromAmount) * getExchangeRate(fromToken.symbol, toToken.symbol)).toFixed(6);
      setToAmount(calculatedAmount);
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount('');
    setToAmount('');
  };

  const isInsufficientBalance = () => {
    if (!fromToken || !fromAmount) return false;
    return Number(fromAmount) > (balances[fromToken.symbol as keyof typeof balances] || 0);
  };

  const openConfirmation = () => {
    if (isInsufficientBalance()) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken?.symbol} to complete this swap.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!fromToken || !toToken || !fromAmount || Number(fromAmount) <= 0) {
      toast({
        title: "Invalid Swap",
        description: "Please enter a valid amount to swap.",
        variant: "destructive"
      });
      return;
    }
    
    setIsConfirmationOpen(true);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) return;
    
    setSwapping(true);
    setIsConfirmationOpen(false);
    
    try {
      setTimeout(() => {
        const calculatedToAmount = Number(toAmount);
        
        const newBalances = { ...balances };
        newBalances[fromToken.symbol] = Number(newBalances[fromToken.symbol]) - Number(fromAmount) - networkFee;
        newBalances[toToken.symbol] = Number(newBalances[toToken.symbol]) + calculatedToAmount;
        setBalances(newBalances);
        
        const newTransaction = {
          id: Date.now().toString(),
          type: 'swap',
          status: 'completed',
          amount: fromAmount,
          fromAsset: fromToken.symbol,
          toAsset: toToken.symbol,
          toAmount: calculatedToAmount.toString(),
          timestamp: new Date().toISOString(),
          changePercentage: '+64,624.03%'
        };
        
        setTransactions([newTransaction, ...transactions]);
        
        toast({
          title: 'Swap Successful',
          description: `You have successfully swapped ${fromAmount} ${fromToken.symbol} for ${calculatedToAmount.toFixed(6)} ${toToken.symbol}.`,
        });
        
        setFromAmount('');
        setToAmount('');
        setSwapping(false);
      }, 1500);
    } catch (error) {
      console.error('Swap error:', error);
      setSwapping(false);
      toast({
        title: 'Swap Failed',
        description: 'There was an error processing your swap.',
        variant: 'destructive'
      });
    }
  };

  const getChangeValue = (token: CryptoAsset): number => {
    switch (timeFilter) {
      case '7d':
        return token.change_7d || token.change_24h || 0;
      case '30d':
        return token.change_30d || token.change_24h || 0;
      default:
        return token.change_24h || 0;
    }
  };

  if (pricesLoading) {
    return (
      <MainLayout title="Swap" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <p className="text-gray-500">Loading current prices...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Swap" showBack>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="mb-1">
            <div className="text-gray-500 mb-2">You Pay</div>
            <div className="flex items-end justify-between mb-2">
              <Input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent border-none text-4xl font-medium text-gray-900 focus-visible:ring-0 focus-visible:outline-none p-0 h-auto"
                placeholder="0"
              />
              
              {fromToken && (
                <div className="ml-2">
                  <TokenSelector
                    selectedToken={fromToken as any}
                    onSelectToken={(token) => setFromToken(token as unknown as CryptoAsset)}
                    tokens={assets as any[]}
                    darkMode={false}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">
                ${fromAmount ? (Number(fromAmount) * (fromToken?.price || 0)).toFixed(2) : '0.00'}
                &nbsp;
                <button className="text-gray-400 hover:text-gray-600">
                  <RefreshCw size={12} className="inline" />
                </button>
              </div>
              <div className="flex gap-2">
                {fromToken && (
                  <>
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                      onClick={() => {
                        if (fromToken) {
                          const balance = balances[fromToken.symbol as keyof typeof balances] || 0;
                          setFromAmount((balance / 2).toString());
                        }
                      }}
                    >
                      50%
                    </button>
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                      onClick={() => {
                        if (fromToken) {
                          const balance = balances[fromToken.symbol as keyof typeof balances] || 0;
                          setFromAmount(balance.toString());
                        }
                      }}
                    >
                      Max
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative flex justify-center -my-3 z-10">
            <button
              onClick={handleSwitchTokens}
              className="bg-kash-green rounded-full p-2 hover:bg-opacity-90 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" /><path d="M19 9l-7-6-7 6" /><path d="M19 15l-7 6-7-6" />
              </svg>
            </button>
          </div>
          
          <div className="mt-1">
            <div className="text-gray-500 mb-2">You Receive</div>
            <div className="flex items-end justify-between mb-2">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="flex-1 bg-transparent border-none text-4xl font-medium text-gray-900 focus-visible:ring-0 focus-visible:outline-none p-0 h-auto"
                placeholder="0"
              />
              
              {toToken && (
                <div className="ml-2">
                  <TokenSelector
                    selectedToken={toToken as any}
                    onSelectToken={(token) => setToToken(token as unknown as CryptoAsset)}
                    tokens={assets.filter(asset => asset.symbol !== fromToken?.symbol) as any[]}
                    darkMode={false}
                  />
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              ${toAmount ? (Number(toAmount) * (toToken?.price || 0)).toFixed(2) : '0.00'}
            </div>
          </div>
          
          <KashButton
            fullWidth
            disabled={swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance()}
            onClick={openConfirmation}
            className="mt-6 bg-kash-green text-white"
          >
            {swapping ? 'Swapping...' : isInsufficientBalance() ? 'Insufficient Balance' : 'Swap'}
          </KashButton>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-3 text-gray-800">Tokens</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-white text-gray-800 border border-gray-300 rounded-full px-4 py-2 min-w-[120px] flex items-center justify-between hover:bg-gray-100">
                <span>{tokenFilter}</span>
                <ChevronDown size={18} className="text-gray-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 rounded-xl p-1 shadow-md">
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTokenFilter("Trending")}
                >
                  Trending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTokenFilter("Favorites")}
                >
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTokenFilter("All")}
                >
                  All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-white text-gray-800 border border-gray-300 rounded-full px-4 py-2 min-w-[120px] flex items-center justify-between hover:bg-gray-100">
                <span>{networkFilter}</span>
                <ChevronDown size={18} className="text-gray-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 rounded-xl p-1 shadow-md">
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("All")}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("Solana")}
                >
                  Solana
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("Ethereum")}
                >
                  Ethereum
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("Bitcoin")}
                >
                  Bitcoin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("Base")}
                >
                  Base
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setNetworkFilter("Polygon")}
                >
                  Polygon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-white text-gray-800 border border-gray-300 rounded-full px-4 py-2 min-w-[90px] flex items-center justify-between hover:bg-gray-100">
                <span>{timeFilter}</span>
                <ChevronDown size={18} className="text-gray-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 rounded-xl p-1 shadow-md">
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTimeFilter("24h")}
                >
                  24h
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTimeFilter("7d")}
                >
                  7d
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-md hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-gray-800"
                  onClick={() => setTimeFilter("30d")}
                >
                  30d
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid grid-cols-12 text-sm text-gray-500 mb-2 px-1">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Token</div>
            <div className="col-span-4 text-right">Price</div>
          </div>
          
          <div className="space-y-1">
            {trendingTokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No trending tokens found for the selected filters
              </div>
            ) : (
              trendingTokens.map((token, index) => (
                <div 
                  key={token.id} 
                  className="grid grid-cols-12 items-center px-3 py-2 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                  onClick={() => {
                    setFromToken(assets.find(a => a.symbol === 'SOL') || null);
                    setToToken(token);
                    navigate('/swap');
                  }}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="bg-kash-green text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="col-span-7 flex items-center">
                    <div className="mr-2 relative">
                      <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full object-contain bg-gray-100" />
                      {token.platform && token.platform.logo && (
                        <div className="absolute -bottom-1 -right-1 rounded-full overflow-hidden bg-white border-2 border-white w-4 h-4 flex items-center justify-center">
                          <img 
                            src={token.platform.logo}
                            alt={token.platform.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = token.platform?.name?.charAt(0) || '';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{token.name}</div>
                      <div className="text-gray-500 text-xs">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="col-span-4 text-right">
                    <div className="text-gray-900 text-sm">${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className={`text-xs ${getChangeValue(token) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {getChangeValue(token) >= 0 ? '+' : ''}{getChangeValue(token).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {fromToken && toToken && (
        <SwapConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleSwap}
          fromToken={fromToken}
          toToken={toToken}
          amount={Number(fromAmount)}
          estimatedReceived={Number(toAmount)}
          fee={networkFee}
          rate={getExchangeRate(fromToken.symbol, toToken.symbol)}
        />
      )}
    </MainLayout>
  );
};

export default SwapCrypto;
