import React, { useState, useEffect } from 'react';
import { ArrowDownUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import TokenSelector from './TokenSelector';
import SwapConfirmationModal from './SwapConfirmationModal';
import TransactionSuccess from './TransactionSuccess';
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
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full min-h-screen md:min-h-0">
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
      
      {/* Swap Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance()}
        onClick={openConfirmation}
        className={`mt-6 w-full py-3 px-4 rounded-xl font-medium text-white transition-all bg-kash-green 
          ${swapping || !fromAmount || Number(fromAmount) <= 0 || isInsufficientBalance() 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-kash-green/90 shadow-md hover:shadow-lg'}`}
      >
        {swapping ? 'Swapping...' : isInsufficientBalance() ? 'Insufficient Balance' : 'Swap'}
      </motion.button>
      
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
      
      {/* Transaction Success */}
      <TransactionSuccess
        isOpen={transactionSuccess}
        onClose={() => setTransactionSuccess(false)}
        transaction={transaction}
      />
    </div>
  );
};

export default SwapForm;
