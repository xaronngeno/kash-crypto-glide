
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '@/components/ui/KashButton';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KashCard } from '@/components/ui/KashCard';

interface SellUsdtSectionProps {
  asset?: {
    symbol: string;
    name: string;
    logo: string;
    price: number;
  };
  balance: number;
  onSellComplete: (amount: number) => void;
}

const SellUsdtSection = ({ asset, balance, onSellComplete }: SellUsdtSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Fixed rate for KES/USDT conversion
  const usdtToKesRate = 145; // Example rate: 1 USDT = 145 KES
  // Maximum limit for USDT transactions
  const maxUsdtLimit = 1000;
  
  const handleSell = async () => {
    if (!asset || !amount || !phoneNumber || Number(amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and phone number.",
        variant: "destructive"
      });
      return;
    }
    
    const numAmount = Number(amount);
    
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
    
    setProcessing(true);
    
    try {
      // Simulate API call to process sell order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful sell, proceed to confirmation
      navigate('/transaction-confirmation', {
        state: {
          type: 'sell',
          asset: asset.symbol,
          amount: Number(amount),
          amountKES: Number(amount) * usdtToKesRate,
          phone: phoneNumber
        }
      });
      
      // Call the completion handler
      onSellComplete(Number(amount));
      
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Failed to process your sell request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const kesAmount = amount ? (Number(amount) * usdtToKesRate).toFixed(2) : '0.00';
  
  return (
    <div className="space-y-4">
      <KashCard>
        <div className="space-y-4">
          <h3 className="font-medium text-lg text-gray-800">Sell USDT for M-PESA</h3>
          
          {/* Amount Input */}
          <div>
            <div className="text-gray-500 mb-2">USDT Amount</div>
            <div className="flex items-end justify-between mb-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers
                  if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                    setAmount(value);
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
                ${amount ? Number(amount).toFixed(2) : '0.00'}
                &nbsp;
                <button className="text-gray-400 hover:text-gray-600">
                  <RefreshCw size={12} className="inline" />
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                  onClick={() => {
                    setAmount((balance / 2).toString());
                  }}
                >
                  50%
                </button>
                <button 
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-800"
                  onClick={() => {
                    const maxAllowedAmount = Math.min(balance, maxUsdtLimit);
                    setAmount(maxAllowedAmount.toString());
                  }}
                >
                  Max
                </button>
              </div>
            </div>
            {Number(amount) > maxUsdtLimit && (
              <div className="text-red-500 text-xs mt-1">
                Maximum transaction limit is {maxUsdtLimit} USDT
              </div>
            )}
          </div>
          
          {/* You Receive */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-gray-500 mb-2">You Receive (KES)</div>
            <div className="text-4xl font-medium text-gray-900">
              {Number(kesAmount).toLocaleString('en-KE')} <span className="text-gray-500 text-sm">KES</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Rate: 1 USDT = {usdtToKesRate} KES
            </div>
          </div>
          
          {/* Phone Number Input */}
          <div className="pt-4">
            <div className="text-gray-500 mb-2">M-PESA Phone Number</div>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              className="border border-gray-300 rounded-lg"
            />
          </div>
          
          {/* Sell Button */}
          <KashButton
            fullWidth
            disabled={
              processing || 
              !amount || 
              Number(amount) <= 0 || 
              Number(amount) > balance || 
              Number(amount) > maxUsdtLimit || 
              !phoneNumber
            }
            onClick={handleSell}
            className="mt-6 bg-kash-green text-white"
          >
            {processing ? 'Processing...' : 'Sell USDT'}
          </KashButton>
        </div>
      </KashCard>
      
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <h4 className="font-medium text-amber-700 mb-1">Important</h4>
        <p className="text-sm text-amber-700">
          Funds will be sent to the M-PESA number provided. Please ensure the number is correct before proceeding.
          Maximum transaction limit: {maxUsdtLimit} USDT.
        </p>
      </div>
    </div>
  );
};

export default SellUsdtSection;
