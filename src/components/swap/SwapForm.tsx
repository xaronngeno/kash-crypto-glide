
import React, { useState, useEffect } from 'react';
import { ArrowDownUp, RefreshCw, ExternalLink, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import TokenSelector from './TokenSelector';
import SwapRateInfo from './SwapRateInfo';
import { SwapTransaction } from './types';

interface SwapFormProps {
  assets: any[];
  balances: Record<string, number>;
  onSwapComplete: (transaction: SwapTransaction) => void;
}

const SwapForm: React.FC<SwapFormProps> = ({ assets, balances, onSwapComplete }) => {
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [swapping, setSwapping] = useState(false);
  const [showRateInfo, setShowRateInfo] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transaction, setTransaction] = useState<SwapTransaction | null>(null);
  const [networkFee] = useState(0.001);
  
  useEffect(() => {
    // Initial token selection
    if (assets.length > 0 && !fromToken && !toToken) {
      const solToken = assets.find(asset => asset.symbol === 'SOL');
      const usdtToken = assets.find(asset => asset.symbol === 'USDT');
      
      if (solToken) setFromToken(solToken);
      if (usdtToken) setToToken(usdtToken);
    }
  }, [assets, fromToken, toToken]);

  const getExchangeRate = (from: string, to: string): number => {
    const fromAsset = assets.find((asset) => asset.symbol === from);
    const toAsset = assets.find((asset) => asset.symbol === to);

    if (!fromAsset || !toAsset) return 0;
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
    return Number(fromAmount) > (balances[fromToken.symbol] || 0);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) return;
    
    if (isInsufficientBalance()) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken?.symbol} to complete this swap.`,
        variant: "destructive"
      });
      return;
    }
    
    setSwapping(true);
    
    try {
      // Simulate API call with timeout
      setTimeout(() => {
        const newTransaction = {
          id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
          fromAsset: fromToken.symbol,
          toAsset: toToken.symbol,
          fromAmount: Number(fromAmount),
          toAmount: Number(toAmount),
          timestamp: new Date(),
          status: 'completed' as const
        };
        
        setTransaction(newTransaction);
        setTransactionSuccess(true);
        onSwapComplete(newTransaction);
        
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

  // Mock blockchain explorer URLs based on token
  const getExplorerUrl = (txId: string, token: string) => {
    switch (token.toLowerCase()) {
      case 'sol':
        return `https://explorer.solana.com/tx/${txId}`;
      case 'btc':
        return `https://blockstream.info/tx/${txId}`;
      case 'eth':
        return `https://etherscan.io/tx/${txId}`;
      default:
        return `https://explorer.solana.com/tx/${txId}`;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full min-h-screen md:min-h-0">
      <AnimatePresence mode="wait">
        {transactionSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center py-8"
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <Check className="text-green-500 w-10 h-10" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Swap Successful!</h2>
              <p className="text-gray-500 text-center mb-6">
                You have successfully swapped {transaction?.fromAmount} {transaction?.fromAsset} for {Number(transaction?.toAmount).toFixed(6)} {transaction?.toAsset}
              </p>
              
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-8">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-medium text-sm text-right">
                      {transaction?.id.substring(0, 8)}...{transaction?.id.substring(transaction.id.length - 8)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span className="text-green-500 font-medium">Completed</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium">
                      {transaction?.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col w-full gap-3">
                <motion.a
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  href={transaction ? getExplorerUrl(transaction.id, transaction.toAsset) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on Blockchain Explorer
                </motion.a>
                
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTransactionSuccess(false)}
                  className="px-4 py-3 bg-kash-green text-white rounded-xl hover:bg-kash-green/90 transition-colors"
                >
                  Swap Again
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* From Token Section */}
            <div className="mb-4">
              <div className="text-gray-500 mb-2 text-sm font-medium">You Pay</div>
              <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-kash-green focus-within:ring-1 focus-within:ring-kash-green/20 transition-all">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-3xl font-medium text-gray-900 focus:outline-none focus:ring-0"
                  placeholder="0"
                />
                
                {fromToken && (
                  <div>
                    <TokenSelector
                      selectedToken={fromToken}
                      onSelectToken={setFromToken}
                      tokens={assets}
                      darkMode={false}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2 text-sm px-1">
                <div className="text-gray-500">
                  ${fromAmount ? (Number(fromAmount) * (fromToken?.price || 0)).toFixed(2) : '0.00'}
                  <button className="text-gray-400 hover:text-gray-600 ml-1">
                    <RefreshCw size={12} className="inline" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {fromToken && (
                    <>
                      <button 
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800 transition-colors"
                        onClick={() => {
                          if (fromToken) {
                            const balance = balances[fromToken.symbol] || 0;
                            setFromAmount((balance / 2).toString());
                          }
                        }}
                      >
                        50%
                      </button>
                      <button 
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800 transition-colors"
                        onClick={() => {
                          if (fromToken) {
                            const balance = balances[fromToken.symbol] || 0;
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSwitchTokens}
                className="bg-kash-green rounded-full p-3 hover:bg-opacity-90 text-white shadow-md hover:shadow-lg transition-all"
              >
                <ArrowDownUp size={20} />
              </motion.button>
            </div>
            
            {/* To Token Section */}
            <div className="mt-4">
              <div className="text-gray-500 mb-2 text-sm font-medium">You Receive</div>
              <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-kash-green focus-within:ring-1 focus-within:ring-kash-green/20 transition-all">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  className="w-full bg-transparent border-none text-3xl font-medium text-gray-900 focus:outline-none focus:ring-0"
                  placeholder="0"
                />
                
                {toToken && (
                  <div>
                    <TokenSelector
                      selectedToken={toToken}
                      onSelectToken={setToToken}
                      tokens={assets.filter(asset => asset.symbol !== fromToken?.symbol)}
                      darkMode={false}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2 text-sm px-1">
                <div className="text-gray-500">
                  ${toAmount ? (Number(toAmount) * (toToken?.price || 0)).toFixed(2) : '0.00'}
                </div>
                
                {fromToken && toToken && (
                  <div className="text-xs text-gray-500">
                    1 {fromToken.symbol} = {getExchangeRate(fromToken.symbol, toToken.symbol).toFixed(6)} {toToken.symbol}
                  </div>
                )}
              </div>
            </div>

            {/* Rate Info Toggle */}
            <div className="mt-4">
              <button 
                onClick={() => setShowRateInfo(!showRateInfo)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
              >
                {showRateInfo ? 'Hide Details' : 'Show Details'}
                <motion.span
                  animate={{ rotate: showRateInfo ? 180 : 0 }}
                  className="ml-1 inline-block"
                >
                  ▼
                </motion.span>
              </button>
              
              <AnimatePresence>
                {showRateInfo && fromToken && toToken && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3">
                      <SwapRateInfo 
                        fromToken={fromToken} 
                        toToken={toToken} 
                        rate={getExchangeRate(fromToken.symbol, toToken.symbol)} 
                        fee={networkFee}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Swap Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance()}
              onClick={handleSwap}
              className={`mt-6 w-full py-3 px-4 rounded-xl font-medium text-white transition-all bg-kash-green 
                ${swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance() 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'hover:bg-kash-green/90 shadow-md hover:shadow-lg'}`}
            >
              {swapping ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Swapping...
                </div>
              ) : isInsufficientBalance() ? 'Insufficient Balance' : 'Swap'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwapForm;
