
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '@/components/ui/KashButton';
import { Input } from '@/components/ui/input';
import { KashInput } from '@/components/ui/KashInput';
import { RefreshCw, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KashCard } from '@/components/ui/KashCard';
import { AssetInfo, RateInfo } from './types';
import { validatePhoneNumber, navigateToConfirmation } from '@/utils/mpesaUtils';

interface SellUsdtTabProps {
  asset?: AssetInfo;
  balance: number;
  onTransactionComplete: (amount: number, type: 'buy' | 'sell') => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  rateInfo: RateInfo;
}

const SellUsdtTab = ({ 
  asset, 
  balance, 
  onTransactionComplete, 
  phoneNumber, 
  setPhoneNumber,
  rateInfo
}: SellUsdtTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sellAmount, setSellAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { usdtToKesRate, maxUsdtLimit } = rateInfo;
  
  // Calculate KES amount for sell tab
  const sellKesAmount = sellAmount ? (Number(sellAmount) * usdtToKesRate).toFixed(2) : '0.00';
  
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
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
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
      
      navigateToConfirmation(navigate, 'sell', {
        asset: asset.symbol,
        amount: Number(sellAmount),
        amountKES: Number(sellAmount) * usdtToKesRate,
        phone: phoneNumber
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

  return (
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
  );
};

export default SellUsdtTab;
