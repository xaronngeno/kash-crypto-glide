import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface CryptoAsset {
  symbol: string;
  name: string;
  logo: string;
  price: number;
}

const assets: CryptoAsset[] = [
  { symbol: 'USDT', name: 'Tether', logo: '/usdt-logo.png', price: 1.00 },
  { symbol: 'BTC', name: 'Bitcoin', logo: '/btc-logo.png', price: 60000 },
  { symbol: 'ETH', name: 'Ethereum', logo: '/eth-logo.png', price: 3000 },
];

const SwapCrypto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [fromToken, setFromToken] = useState<CryptoAsset | null>(assets[0]);
  const [toToken, setToToken] = useState<CryptoAsset | null>(assets[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);
  const [balances, setBalances] = useState({
    USDT: 1000,
    BTC: 0.01,
    ETH: 0.1,
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  const getExchangeRate = (from: string, to: string): number => {
    const fromAsset = assets.find((asset) => asset.symbol === from);
    const toAsset = assets.find((asset) => asset.symbol === to);

    if (!fromAsset || !toAsset) {
      console.error('Asset not found');
      return 0;
    }

    return fromAsset.price / toAsset.price;
  };

  const calculateToAmount = (): string => {
    if (!fromToken || !toToken || !fromAmount) return '0.00';
    return (Number(fromAmount) * getExchangeRate(fromToken.symbol, toToken.symbol)).toFixed(6);
  };

  useEffect(() => {
    if (swapComplete) {
      toast({
        title: 'Swap Successful',
        description: `You have successfully swapped ${fromAmount} ${fromToken?.symbol} for ${calculateToAmount()} ${toToken?.symbol}.`,
      });
      setTimeout(() => setSwapComplete(false), 3000);
    }
  }, [swapComplete, fromAmount, fromToken, toToken, toast]);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !toToken) return;
    
    setSwapping(true);
    
    try {
      // Simulating exchange execution
      setTimeout(() => {
        // Calculate toAmount based on exchange rate
        const calculatedToAmount = Number(fromAmount) * getExchangeRate(fromToken.symbol, toToken.symbol);
        
        // Update balances
        const newBalances = { ...balances };
        newBalances[fromToken.symbol] = Number(newBalances[fromToken.symbol]) - Number(fromAmount);
        newBalances[toToken.symbol] = Number(newBalances[toToken.symbol]) + calculatedToAmount;
        setBalances(newBalances);
        
        // Add to transaction history
        const newTransaction = {
          id: Date.now().toString(), // Using string instead of number for id
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
        setSwapComplete(true);
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

  return (
    <MainLayout title="Swap Crypto" showBack>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Swap Crypto</h2>
          <p className="text-gray-600">
            Easily swap between different cryptocurrencies
          </p>
        </div>

        <KashCard>
          <div className="space-y-5">
            {/* From Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="relative">
                <select
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                  value={fromToken?.symbol}
                  onChange={(e) => {
                    const selectedAsset = assets.find((asset) => asset.symbol === e.target.value);
                    setFromToken(selectedAsset || null);
                  }}
                >
                  {assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <input
                type="number"
                placeholder="Enter amount"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-base"
              />
              {fromToken && (
                <p className="text-sm text-gray-500 mt-1">
                  Balance: {balances[fromToken.symbol as keyof typeof balances]} {fromToken.symbol}
                </p>
              )}
            </div>

            {/* Switch Tokens */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const tempToken = fromToken;
                  setFromToken(toToken);
                  setToToken(tempToken);
                }}
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              >
                <ArrowRightLeft size={20} className="text-gray-600" />
              </button>
            </div>

            {/* To Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="relative">
                <select
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                  value={toToken?.symbol}
                  onChange={(e) => {
                    const selectedAsset = assets.find((asset) => asset.symbol === e.target.value);
                    setToToken(selectedAsset || null);
                  }}
                >
                  {assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <div className="bg-kash-lightGray p-4 rounded-lg mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Amount</span>
                  <span className="text-xl font-semibold">{calculateToAmount()} {toToken?.symbol}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Exchange Rate: 1 {fromToken?.symbol} = {getExchangeRate(fromToken?.symbol || 'USDT', toToken?.symbol || 'BTC')} {toToken?.symbol}
                </div>
              </div>
            </div>

            <KashButton
              fullWidth
              disabled={swapping}
              onClick={handleSwap}
            >
              {swapping ? 'Swapping...' : 'Swap'}
            </KashButton>
          </div>
        </KashCard>

        {/* Transaction History */}
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Transaction History</h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <KashCard key={transaction.id} variant="outline" padding="sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {transaction.type === 'swap' ? 'Swap' : 'Transaction'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {transaction.type === 'swap' && (
                        <>
                          <p className="text-sm">
                            {transaction.amount} {transaction.fromAsset} <ArrowRightLeft size={14} className="inline-block mx-1" /> {transaction.toAmount} {transaction.toAsset}
                          </p>
                          {transaction.status === 'completed' ? (
                            <span className="text-green-500 text-xs">Completed</span>
                          ) : (
                            <span className="text-yellow-500 text-xs">Pending</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </KashCard>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No transactions yet.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SwapCrypto;
