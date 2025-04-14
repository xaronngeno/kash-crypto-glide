
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { Phone, BadgeDollarSign, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KashCard } from '@/components/ui/KashCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { AssetInfo, RateInfo } from './types';
import { 
  formatPhoneNumber, 
  validatePhoneNumber, 
  initiateMpesaPayment,
  navigateToConfirmation
} from '@/utils/mpesaUtils';

interface BuyUsdtTabProps {
  asset?: AssetInfo;
  onTransactionComplete: (amount: number, type: 'buy' | 'sell') => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  rateInfo: RateInfo;
}

const BuyUsdtTab = ({ 
  asset, 
  onTransactionComplete, 
  phoneNumber, 
  setPhoneNumber,
  rateInfo
}: BuyUsdtTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [buyAmount, setBuyAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { kesExchangeRate, maxUsdtLimit, minKesAmount } = rateInfo;
  const maxKesAmount = Math.floor(maxUsdtLimit / kesExchangeRate);
  
  // Calculate USDT amount for buy tab
  const buyUsdtAmount = buyAmount ? (Number(buyAmount) * kesExchangeRate).toFixed(2) : '0.00';
  const buyUsdtAmountNum = parseFloat(buyUsdtAmount);
  const exceedsUsdtLimit = buyUsdtAmountNum > maxUsdtLimit;
  
  const clearError = () => {
    setError(null);
  };
  
  const handleBuyUsdt = async () => {
    clearError();
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
        description: `Maximum transaction limit is ${maxUsdtLimit} USDT (${maxKesAmount.toLocaleString()} KES)`,
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
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error: apiError } = await initiateMpesaPayment(
        formattedPhone, 
        Number(buyAmount), 
        user?.id, 
        buyUsdtAmount, 
        'USDT'
      );
      
      if (apiError) {
        console.error("Supabase function error:", apiError);
        setError("Failed to initiate M-PESA payment. Please try again later.");
        toast({
          title: "Payment failed",
          description: "Failed to initiate M-PESA payment. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.error) {
        console.error("M-PESA API error:", data);
        setError(data.error || "An error occurred with the M-PESA transaction.");
        
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
      
      navigateToConfirmation(navigate, 'buy', {
        asset: 'USDT',
        amountKES: Number(buyAmount),
        amountUSDT: Number(buyUsdtAmount),
        phone: formattedPhone,
        checkoutRequestID: data?.CheckoutRequestID || 'pending'
      });
      
      // Call the completion handler
      onTransactionComplete(Number(buyUsdtAmount), 'buy');
      
    } catch (error: any) {
      console.error('STK push error:', error);
      setError("Could not initiate M-PESA payment. Please try again.");
      
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
    <>
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
                Min: {minKesAmount} KES | Max: {maxKesAmount.toLocaleString()} KES
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
                Maximum limit: {maxUsdtLimit} USDT ({maxKesAmount.toLocaleString()} KES)
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
    </>
  );
};

export default BuyUsdtTab;
