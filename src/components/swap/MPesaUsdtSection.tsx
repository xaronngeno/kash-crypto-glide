
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '@/components/ui/KashButton';
import { Input } from '@/components/ui/input';
import { KashInput } from '@/components/ui/KashInput';
import { RefreshCw, Phone, ArrowUpDown, BadgeDollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KashCard } from '@/components/ui/KashCard';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MPesaUsdtSectionProps {
  asset?: {
    symbol: string;
    name: string;
    logo: string;
    price: number;
  };
  balance: number;
  onTransactionComplete: (amount: number, type: 'buy' | 'sell') => void;
}

const MPesaUsdtSection = ({ asset, balance, onTransactionComplete }: MPesaUsdtSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Common states
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  
  // Sell USDT states
  const [sellAmount, setSellAmount] = useState('');
  
  // Buy USDT states
  const [buyAmount, setBuyAmount] = useState('');
  
  // Fixed rates for KES/USDT conversion
  const usdtToKesRate = 145; // Example rate: 1 USDT = 145 KES
  const kesExchangeRate = 0.0069; // 1 KES = 0.0069 USDT
  
  // Maximum and minimum limits
  const maxUsdtLimit = 1000;
  const minKesAmount = 500;
  const maxKesAmount = Math.floor(maxUsdtLimit / kesExchangeRate);
  
  // Calculate KES amount for sell tab
  const sellKesAmount = sellAmount ? (Number(sellAmount) * usdtToKesRate).toFixed(2) : '0.00';
  
  // Calculate USDT amount for buy tab
  const buyUsdtAmount = buyAmount ? (Number(buyAmount) * kesExchangeRate).toFixed(2) : '0.00';
  const buyUsdtAmountNum = parseFloat(buyUsdtAmount);
  const exceedsUsdtLimit = buyUsdtAmountNum > maxUsdtLimit;

  const handleSellUsdt = async () => {
    if (!asset || !sellAmount || !phoneNumber || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and phone number.",
        variant: "destructive"
      });
      return;
    }
    
    const numAmount = Number(sellAmount);
    
    if (numAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${asset.symbol} to complete this sell.`,
        variant: "destructive"
      });
      return;
    }
    
    if (numAmount > maxUsdtLimit) {
      toast({
        title: "Transaction Limit Exceeded",
        description: `Maximum transaction limit is ${maxUsdtLimit} USDT.`,
        variant: "destructive"
      });
      return;
    }
    
    // Validate phone number (simple validation for Kenyan numbers)
    if (!/^(?:\+254|0)[17]\d{8}$/.test(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call to process sell order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful sell, proceed to confirmation
      navigate('/transaction-confirmation', {
        state: {
          type: 'sell',
          asset: asset.symbol,
          amount: Number(sellAmount),
          amountKES: Number(sellAmount) * usdtToKesRate,
          phone: phoneNumber
        }
      });
      
      // Call the completion handler
      onTransactionComplete(Number(sellAmount), 'sell');
      
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Failed to process your sell request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyUsdt = async () => {
    if (!buyAmount || Number(buyAmount) < minKesAmount) {
      toast({
        title: "Invalid amount",
        description: `Amount must be at least ${minKesAmount} KES`,
        variant: "destructive"
      });
      return;
    }
    
    if (exceedsUsdtLimit) {
      toast({
        title: "Transaction Limit Exceeded",
        description: `Maximum transaction limit is ${maxUsdtLimit} USDT (${Math.floor(maxUsdtLimit / kesExchangeRate).toLocaleString()} KES)`,
        variant: "destructive"
      });
      return;
    }
    
    if (!phoneNumber) {
      toast({
        title: "Missing phone number",
        description: "Please enter a valid M-PESA phone number",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let formattedPhone = phoneNumber.replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }
      
      console.log("Calling M-PESA STK push with:", {
        phone: formattedPhone,
        amount: Number(buyAmount),
      });
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone: formattedPhone,
          amount: Number(buyAmount),
          reference: `Kash-${user?.id?.substring(0, 8) || 'Guest'}`,
          description: `Buy ${buyUsdtAmount} USDT on Kash`,
        },
      });
      
      console.log("M-PESA STK push response:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        
        toast({
          title: "Payment failed",
          description: "Failed to initiate M-PESA payment. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.error) {
        console.error("M-PESA API error:", data);
        
        toast({
          title: "M-PESA error",
          description: data.error || "An error occurred with the M-PESA transaction.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Payment initiated",
        description: "Please check your phone and enter M-PESA PIN to complete the purchase.",
      });
      
      navigate('/transaction-confirmation', { 
        state: { 
          type: 'buy',
          asset: 'USDT',
          amountKES: Number(buyAmount),
          amountUSDT: Number(buyUsdtAmount),
          phone: formattedPhone,
          checkoutRequestID: data?.CheckoutRequestID || 'pending'
        } 
      });
      
      // Call the completion handler
      onTransactionComplete(Number(buyUsdtAmount), 'buy');
      
    } catch (error: any) {
      console.error('STK push error:', error);
      
      toast({
        title: "Payment failed",
        description: "Could not initiate M-PESA payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="sell" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="sell">Sell USDT</TabsTrigger>
          <TabsTrigger value="buy">Buy USDT</TabsTrigger>
        </TabsList>
        
        {/* SELL TAB */}
        <TabsContent value="sell">
          <KashCard>
            <div className="space-y-4">
              <h3 className="font-medium text-lg text-gray-800">Sell USDT for M-PESA</h3>
              
              {/* Amount Input */}
              <div>
                <div className="text-gray-500 mb-2">USDT Amount</div>
                <div className="flex items-end justify-between mb-2">
                  <Input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string or valid numbers
                      if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSellAmount(value);
                      }
                    }}
                    className="flex-1 bg-transparent border-none text-4xl font-medium text-gray-900 focus-visible:ring-0 focus-visible:outline-none p-0 h-auto"
                    placeholder="0"
                  />
                  
                  <div className="flex flex-col items-end">
                    <div className="text-gray-900 font-medium">USDT</div>
                    <div className="text-gray-500 text-sm">
                      Balance: {balance.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    ${sellAmount ? Number(sellAmount).toFixed(2) : '0.00'}
                    &nbsp;
                    <button className="text-gray-400 hover:text-gray-600">
                      <RefreshCw size={12} className="inline" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                      onClick={() => {
                        setSellAmount((balance / 2).toString());
                      }}
                    >
                      50%
                    </button>
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                      onClick={() => {
                        const maxAllowedAmount = Math.min(balance, maxUsdtLimit);
                        setSellAmount(maxAllowedAmount.toString());
                      }}
                    >
                      Max
                    </button>
                  </div>
                </div>
                {Number(sellAmount) > maxUsdtLimit && (
                  <div className="text-red-500 text-xs mt-1">
                    Maximum transaction limit is {maxUsdtLimit} USDT
                  </div>
                )}
              </div>
              
              {/* You Receive */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-gray-500 mb-2">You Receive (KES)</div>
                <div className="text-4xl font-medium text-gray-900">
                  {Number(sellKesAmount).toLocaleString('en-KE')} <span className="text-gray-500 text-sm">KES</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Rate: 1 USDT = {usdtToKesRate} KES
                </div>
              </div>
              
              {/* Phone Number Input */}
              <div className="pt-4">
                <div className="text-gray-500 mb-2">M-PESA Phone Number</div>
                <KashInput
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0712345678"
                  icon={<Phone size={18} className="text-gray-400" />}
                />
              </div>
              
              {/* Sell Button */}
              <KashButton
                fullWidth
                disabled={
                  loading || 
                  !sellAmount || 
                  Number(sellAmount) <= 0 || 
                  Number(sellAmount) > balance || 
                  Number(sellAmount) > maxUsdtLimit || 
                  !phoneNumber
                }
                onClick={handleSellUsdt}
                className="mt-6"
              >
                {loading ? 'Processing...' : 'Sell USDT'}
              </KashButton>
            </div>
          </KashCard>
        </TabsContent>
        
        {/* BUY TAB */}
        <TabsContent value="buy">
          <KashCard>
            <div className="space-y-4">
              <h3 className="font-medium text-lg text-gray-800">Buy USDT with M-PESA</h3>
              
              {/* Phone Number Input */}
              <div>
                <div className="text-gray-500 mb-2">M-PESA Phone Number</div>
                <KashInput
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0712345678"
                  icon={<Phone size={18} className="text-gray-400" />}
                />
              </div>
              
              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-gray-500">Amount (KES)</div>
                  <span className="text-xs text-gray-500">
                    Min: {minKesAmount} KES | Max: {Math.floor(maxUsdtLimit / kesExchangeRate).toLocaleString()} KES
                  </span>
                </div>
                <KashInput
                  type="number"
                  placeholder="Enter amount in KES"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  icon={<BadgeDollarSign size={18} className="text-gray-400" />}
                />
                {exceedsUsdtLimit && (
                  <div className="text-red-500 text-xs mt-1">
                    Maximum limit: {maxUsdtLimit} USDT ({Math.floor(maxUsdtLimit / kesExchangeRate).toLocaleString()} KES)
                  </div>
                )}
              </div>
              
              {/* You Receive */}
              <div className="bg-kash-lightGray p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">You will receive</span>
                  <span className="text-xl font-semibold">{buyUsdtAmount} USDT</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Exchange Rate: 1 KES = {kesExchangeRate} USDT
                </div>
              </div>
              
              {/* Buy Button */}
              <KashButton
                fullWidth
                disabled={
                  loading ||
                  !buyAmount || 
                  Number(buyAmount) < minKesAmount || 
                  exceedsUsdtLimit || 
                  !phoneNumber
                }
                onClick={handleBuyUsdt}
                className="mt-6"
              >
                {loading ? 'Processing...' : 'Continue to M-PESA'}
              </KashButton>
            </div>
          </KashCard>
        </TabsContent>
      </Tabs>
      
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <h4 className="font-medium text-amber-700 mb-1">Important</h4>
        <p className="text-sm text-amber-700">
          M-PESA transactions are processed instantly. Please ensure the phone number is correct before proceeding.
          Maximum transaction limit: {maxUsdtLimit} USDT.
        </p>
      </div>
      
      <div className="space-y-4 mt-2">
        <h3 className="font-medium">How it works</h3>
        <div className="space-y-3">
          <div className="flex">
            <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
              1
            </div>
            <p className="text-sm text-gray-600">Enter the amount and your M-PESA phone number</p>
          </div>
          <div className="flex">
            <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
              2
            </div>
            <p className="text-sm text-gray-600">{`For buying: You'll receive an M-PESA prompt on your phone`}</p>
          </div>
          <div className="flex">
            <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
              3
            </div>
            <p className="text-sm text-gray-600">Complete the transaction and receive your USDT immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPesaUsdtSection;
