
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import TokenSelector from '@/components/swap/TokenSelector';
import SwapRateInfo from '@/components/swap/SwapRateInfo';
import SwapConfirmationModal from '@/components/swap/SwapConfirmationModal';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';

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
}

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
  const [tokenFilter, setTokenFilter] = useState('Trending');
  const [networkFilter, setNetworkFilter] = useState('Solana');
  const [timeFilter, setTimeFilter] = useState('24h');

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setAssets(prevAssets => 
        prevAssets.map(asset => {
          const priceData = prices[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
              logo: priceData.logo || asset.logo,
              icon: priceData.logo || asset.icon,
            };
          }
          return asset;
        })
      );
    }
  }, [prices]);

  useEffect(() => {
    if (assets.length > 0 && !fromToken && !toToken) {
      // Find SOL and USDC tokens
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
          changePercentage: '+64,624.03%' // Example change percentage
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

  // Example token list data similar to the image
  const trendingTokens = [
    { 
      id: 'elon', 
      name: "Elon Musk's Offspring", 
      symbol: 'MONKEYS', 
      price: 0.00233945, 
      change: '+64,624.03%', 
      rank: 1,
      logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
      icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    },
    // Add more trending tokens as needed
  ];

  return (
    <MainLayout title="Swap" showBack>
      <div className="max-w-md mx-auto">
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          {/* You Pay Section */}
          <div className="mb-1">
            <div className="text-gray-400 mb-2">You Pay</div>
            <div className="flex items-end justify-between mb-2">
              <Input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent border-none text-4xl font-medium text-white focus-visible:ring-0 focus-visible:outline-none p-0 h-auto"
                placeholder="0"
              />
              
              {fromToken && (
                <div className="ml-2">
                  <TokenSelector
                    selectedToken={fromToken as any}
                    onSelectToken={(token) => setFromToken(token as unknown as CryptoAsset)}
                    tokens={assets as any[]}
                    darkMode={true}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-400">
                ${fromAmount ? (Number(fromAmount) * (fromToken?.price || 0)).toFixed(2) : '0.00'}
                &nbsp;
                <button className="text-gray-500 hover:text-gray-300">
                  <RefreshCw size={12} className="inline" />
                </button>
              </div>
              <div className="flex gap-2">
                {fromToken && (
                  <>
                    <button 
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white"
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
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white"
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
          
          {/* Swap Button */}
          <div className="relative flex justify-center -my-3 z-10">
            <button
              onClick={handleSwitchTokens}
              className="bg-purple-600 rounded-full p-2 hover:bg-purple-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 3v18" /><path d="M19 9l-7-6-7 6" /><path d="M19 15l-7 6-7-6" />
              </svg>
            </button>
          </div>
          
          {/* You Receive Section */}
          <div className="mt-1">
            <div className="text-gray-400 mb-2">You Receive</div>
            <div className="flex items-end justify-between mb-2">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="flex-1 bg-transparent border-none text-4xl font-medium text-white focus-visible:ring-0 focus-visible:outline-none p-0 h-auto"
                placeholder="0"
              />
              
              {toToken && (
                <div className="ml-2">
                  <TokenSelector
                    selectedToken={toToken as any}
                    onSelectToken={(token) => setToToken(token as unknown as CryptoAsset)}
                    tokens={assets.filter(asset => asset.symbol !== fromToken?.symbol) as any[]}
                    darkMode={true}
                  />
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-400">
              ${toAmount ? (Number(toAmount) * (toToken?.price || 0)).toFixed(2) : '0.00'}
            </div>
          </div>
          
          {/* Swap Button */}
          <KashButton
            fullWidth
            disabled={swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance()}
            onClick={openConfirmation}
            className="mt-6 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {swapping ? 'Swapping...' : isInsufficientBalance() ? 'Insufficient Balance' : 'Swap'}
          </KashButton>
        </div>
        
        {/* Tokens Section */}
        <div>
          <h2 className="text-xl font-bold mb-3 text-white">Tokens</h2>
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            <button className={`px-4 py-2 rounded-full text-sm ${tokenFilter === 'Trending' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'}`} onClick={() => setTokenFilter('Trending')}>
              Trending <span className="ml-1">▼</span>
            </button>
            <button className={`px-4 py-2 rounded-full text-sm ${networkFilter === 'Solana' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'}`} onClick={() => setNetworkFilter('Solana')}>
              Solana <span className="ml-1">▼</span>
            </button>
            <button className={`px-4 py-2 rounded-full text-sm ${timeFilter === '24h' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'}`} onClick={() => setTimeFilter('24h')}>
              24h <span className="ml-1">▼</span>
            </button>
          </div>
          
          {/* Token List Headers */}
          <div className="grid grid-cols-12 text-sm text-gray-400 mb-2 px-1">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Token</div>
            <div className="col-span-4 text-right">Price</div>
          </div>
          
          {/* Token List */}
          <div className="space-y-1">
            {trendingTokens.map((token, index) => (
              <div 
                key={token.id} 
                className="grid grid-cols-12 items-center px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  setFromToken(assets.find(a => a.symbol === 'SOL') || null);
                  setToToken(token as unknown as CryptoAsset);
                  navigate('/swap');
                }}
              >
                <div className="col-span-1 flex items-center justify-center">
                  <div className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="col-span-7 flex items-center">
                  <div className="mr-2 relative">
                    <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full object-contain bg-gray-900" />
                    <div className="absolute -bottom-1 -right-1 rounded-full overflow-hidden bg-gray-900 border-2 border-gray-800 w-4 h-4 flex items-center justify-center">
                      <span className="text-xs">M</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{token.name}</div>
                    <div className="text-gray-400 text-xs">{token.symbol}</div>
                  </div>
                </div>
                <div className="col-span-4 text-right">
                  <div className="text-white text-sm">${token.price.toFixed(8)}</div>
                  <div className="text-green-500 text-xs">{token.change}</div>
                </div>
              </div>
            ))}
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
