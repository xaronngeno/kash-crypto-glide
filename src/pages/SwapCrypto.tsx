import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TokenSelector from '@/components/swap/TokenSelector';
import SwapRateInfo from '@/components/swap/SwapRateInfo';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import SwapConfirmationModal from '@/components/swap/SwapConfirmationModal';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { KashCard } from '@/components/ui/KashCard';
import { KashInput } from '@/components/ui/KashInput';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Mock token data - would come from an API in a real app
const TOKENS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', decimals: 8 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', decimals: 18 },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: '₮', decimals: 6 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: 'S', decimals: 9 },
];

// Mock exchange rates - would come from API in real app
const RATES = {
  'btc-eth': 13.5,
  'btc-usdt': 29750,
  'btc-sol': 420,
  'eth-btc': 0.074,
  'eth-usdt': 2200,
  'eth-sol': 31,
  'usdt-btc': 0.000034,
  'usdt-eth': 0.00045,
  'usdt-sol': 0.014,
  'sol-btc': 0.0024,
  'sol-eth': 0.032,
  'sol-usdt': 70,
};

// Network fees in the token's native currency
const NETWORK_FEES = {
  'btc': 0.0001,
  'eth': 0.003,
  'usdt': 1,
  'sol': 0.01,
};

const SwapCrypto = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState(TOKENS[1]); // Default to ETH
  const [toToken, setToToken] = useState(TOKENS[0]); // Default to BTC
  const [amount, setAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch user's wallets
  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching wallets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your wallet data.',
          variant: 'destructive',
        });
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate values
  const numericAmount = parseFloat(amount) || 0;
  const rateKey = `${fromToken.id}-${toToken.id}`;
  const swapRate = RATES[rateKey] || 0;
  const estimatedReceived = numericAmount * swapRate;
  const fee = NETWORK_FEES[fromToken.id] || 0;

  // Get user balance for the selected token
  const getTokenBalance = (tokenId) => {
    if (!wallets || isLoading) return 0;
    const wallet = wallets.find(w => w.currency.toLowerCase() === tokenId);
    return wallet ? parseFloat(wallet.balance) : 0;
  };
  
  const fromTokenBalance = getTokenBalance(fromToken.id);

  const handleSwap = async () => {
    setShowConfirmation(false);
    
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to perform this action",
          variant: "destructive",
        });
        return;
      }

      // Check if user has enough balance
      if (numericAmount + fee > fromTokenBalance) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${fromToken.symbol} to complete this swap.`,
          variant: "destructive",
        });
        return;
      }

      // Insert transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          transaction_type: 'swap',
          amount: numericAmount.toString(),
          fee: fee.toString(),
          from_address: `${user.id}_${fromToken.id}`,
          to_address: `${user.id}_${toToken.id}`,
          currency: `${fromToken.symbol} -> ${toToken.symbol}`,
          blockchain: fromToken.id,
          status: 'completed'
        }]);

      if (txError) {
        console.error('Transaction recording error:', txError);
        toast({
          title: "Transaction Failed",
          description: "Could not complete the swap transaction.",
          variant: "destructive",
        });
        return;
      }

      // Update wallet balances
      // Decrease "from" token balance
      const { error: fromError } = await supabase
        .from('wallets')
        .update({ 
          balance: (fromTokenBalance - numericAmount - fee).toString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('currency', fromToken.id);

      if (fromError) {
        console.error('From wallet update error:', fromError);
        throw fromError;
      }

      // Increase "to" token balance
      const toTokenBalance = getTokenBalance(toToken.id);
      const { error: toError } = await supabase
        .from('wallets')
        .update({ 
          balance: (toTokenBalance + estimatedReceived).toString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('currency', toToken.id);

      if (toError) {
        console.error('To wallet update error:', toError);
        throw toError;
      }

      toast({
        title: "Swap Successful",
        description: `You've successfully swapped ${numericAmount} ${fromToken.symbol} to ${estimatedReceived.toFixed(6)} ${toToken.symbol}`,
      });

      // Reset amount after successful swap
      setAmount('');
      
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: "There was an error processing your swap request.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSwap = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    if (numericAmount + fee > fromTokenBalance) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${fromToken.symbol} to complete this swap.`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
  };

  return (
    <MainLayout title="Swap Crypto" showBack>
      <div className="flex flex-col gap-5">
        <KashCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">From</label>
              <TokenSelector 
                selectedToken={fromToken}
                onSelectToken={setFromToken}
                tokens={TOKENS.filter(t => t.id !== toToken.id)}
              />
            </div>
            
            <div>
              <KashInput
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-gray-500">
                  Available: {fromTokenBalance.toFixed(6)} {fromToken.symbol}
                </span>
                <button 
                  className="text-kash-green"
                  onClick={() => setAmount(fromTokenBalance.toString())}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
        </KashCard>

        <div className="flex justify-center -my-2 z-10">
          <button
            onClick={switchTokens}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ArrowDown size={20} className="text-gray-600" />
          </button>
        </div>

        <KashCard>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">To</label>
            <TokenSelector 
              selectedToken={toToken}
              onSelectToken={setToToken}
              tokens={TOKENS.filter(t => t.id !== fromToken.id)}
            />
            
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">You will receive</div>
              <div className="text-xl font-medium">
                {estimatedReceived.toFixed(6)} {toToken.symbol}
              </div>
            </div>
          </div>
        </KashCard>

        <SwapRateInfo 
          fromToken={fromToken}
          toToken={toToken}
          rate={swapRate}
          fee={fee}
        />

        <Button 
          className="bg-kash-green hover:bg-kash-green/90 h-12 text-base"
          onClick={handleConfirmSwap}
        >
          Swap Now
        </Button>
      </div>

      <SwapConfirmationModal 
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleSwap}
        fromToken={fromToken}
        toToken={toToken}
        amount={numericAmount}
        estimatedReceived={estimatedReceived}
        fee={fee}
        rate={swapRate}
      />
    </MainLayout>
  );
};

export default SwapCrypto;
