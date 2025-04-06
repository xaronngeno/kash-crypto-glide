
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import TokenSelector from '@/components/swap/TokenSelector';
import SwapRateInfo from '@/components/swap/SwapRateInfo';
import SwapConfirmationModal from '@/components/swap/SwapConfirmationModal';
import { Input } from '@/components/ui/input';

import {
  ArrowDownUp,
  ArrowRightLeft,
  Info,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  decimals: number;
  icon?: string;
}

const SwapCrypto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { prices, loading: pricesLoading } = useCryptoPrices();

  // Initialize assets with default values
  const [assets, setAssets] = useState<CryptoAsset[]>([
    { id: 'usdt', symbol: 'USDT', name: 'Tether', logo: '/usdt-logo.png', price: 1.00, decimals: 6 },
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', logo: '/btc-logo.png', price: 60000, decimals: 8 },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', logo: '/eth-logo.png', price: 3000, decimals: 18 },
    { id: 'sol', symbol: 'SOL', name: 'Solana', logo: '/sol-logo.png', price: 150, decimals: 9 },
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

  // Update assets with real-time prices
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setAssets(prevAssets => 
        prevAssets.map(asset => {
          const priceData = prices[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
            };
          }
          return asset;
        })
      );
    }
  }, [prices]);

  // Set default tokens when assets are loaded
  useEffect(() => {
    if (assets.length > 0 && !fromToken && !toToken) {
      setFromToken(assets[0]);
      setToToken(assets[1]);
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

  // Auto-calculate toAmount when fromAmount, fromToken, or toToken changes
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
    // Reset amounts to avoid confusion
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
      // Simulating exchange execution
      setTimeout(() => {
        // Calculate toAmount based on exchange rate
        const calculatedToAmount = Number(toAmount);
        
        // Update balances
        const newBalances = { ...balances };
        newBalances[fromToken.symbol] = Number(newBalances[fromToken.symbol]) - Number(fromAmount) - networkFee;
        newBalances[toToken.symbol] = Number(newBalances[toToken.symbol]) + calculatedToAmount;
        setBalances(newBalances);
        
        // Add to transaction history
        const newTransaction = {
          id: Date.now().toString(),
          type: 'swap',
          status: 'completed',
          amount: fromAmount,
          fromAsset: fromToken.symbol,
          toAsset: toToken.symbol,
          toAmount: calculatedToAmount.toString(),
          timestamp: new Date().toISOString(),
        };
        
        setTransactions([newTransaction, ...transactions]);
        
        // Show confirmation
        toast({
          title: 'Swap Successful',
          description: `You have successfully swapped ${fromAmount} ${fromToken.symbol} for ${calculatedToAmount.toFixed(6)} ${toToken.symbol}.`,
        });
        
        // Reset form
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

  return (
    <MainLayout title="Swap" showBack>
      <div className="max-w-md mx-auto">
        {/* Main Swap Card */}
        <KashCard className="mb-4">
          <div className="flex justify-between items-center pb-4">
            <h2 className="text-lg font-medium">Swap</h2>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-full hover:bg-gray-100" title="Refresh rates">
                <RefreshCw size={18} className="text-gray-600" />
              </button>
              <button className="p-1.5 rounded-full hover:bg-gray-100" title="Settings">
                <Settings size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* From Token */}
          <div className="bg-gray-50 p-4 rounded-xl mb-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">From</span>
              {fromToken && (
                <span className="text-sm text-gray-600">
                  Balance: {balances[fromToken.symbol as keyof typeof balances]} {fromToken.symbol}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {fromToken && (
                <div className="w-32">
                  <TokenSelector
                    selectedToken={fromToken}
                    onSelectToken={setFromToken}
                    tokens={assets}
                  />
                </div>
              )}
              
              <Input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent border-none text-lg font-medium focus-visible:ring-0 focus-visible:outline-none p-0"
                placeholder="0.00"
              />
            </div>
            
            <div className="flex justify-end mt-1">
              <div className="flex gap-2">
                <button 
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
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
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                  onClick={() => {
                    if (fromToken) {
                      const balance = balances[fromToken.symbol as keyof typeof balances] || 0;
                      setFromAmount(balance.toString());
                    }
                  }}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
          
          {/* Switch Button */}
          <div className="flex justify-center -my-2 z-10 relative">
            <button
              onClick={handleSwitchTokens}
              className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-gray-50"
            >
              <ArrowDownUp size={16} className="text-gray-600" />
            </button>
          </div>
          
          {/* To Token */}
          <div className="bg-gray-50 p-4 rounded-xl mt-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">To (Estimated)</span>
              {toToken && (
                <span className="text-sm text-gray-600">
                  Balance: {balances[toToken.symbol as keyof typeof balances]} {toToken.symbol}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {toToken && (
                <div className="w-32">
                  <TokenSelector
                    selectedToken={toToken}
                    onSelectToken={setToToken}
                    tokens={assets.filter(asset => asset.symbol !== fromToken?.symbol)}
                  />
                </div>
              )}
              
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="flex-1 bg-transparent border-none text-lg font-medium focus-visible:ring-0 focus-visible:outline-none p-0"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Rate Info */}
          {fromToken && toToken && fromAmount && toAmount && (
            <div className="mt-4 mb-3">
              <SwapRateInfo
                fromToken={fromToken}
                toToken={toToken}
                rate={getExchangeRate(fromToken.symbol, toToken.symbol)}
                fee={networkFee}
              />
            </div>
          )}
          
          {/* Swap Button */}
          <KashButton
            fullWidth
            disabled={swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance()}
            onClick={openConfirmation}
            className="mt-2"
          >
            {swapping ? 'Swapping...' : isInsufficientBalance() ? 'Insufficient Balance' : 'Review Swap'}
          </KashButton>
        </KashCard>
        
        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Recent Transactions</h3>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((transaction) => (
                <KashCard key={transaction.id} variant="outline" padding="sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-sm">
                        Swap {transaction.fromAsset} → {transaction.toAsset}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {transaction.amount} {transaction.fromAsset}
                      </p>
                      <p className="text-sm text-green-600">
                        {Number(transaction.toAmount).toFixed(6)} {transaction.toAsset}
                      </p>
                    </div>
                  </div>
                </KashCard>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
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
