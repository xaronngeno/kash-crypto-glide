
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, DollarSign } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';

const Buy = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+254712345678'); // Pre-filled
  const [loading, setLoading] = useState(false);
  
  // Fixed exchange rate for simplicity
  const exchangeRate = 0.0083; // 1 KES = 0.0083 USDT
  const minAmount = 500; // Minimum KES amount
  const maxAmount = 100000; // Maximum KES amount
  
  const usdtAmount = amount ? (Number(amount) * exchangeRate).toFixed(2) : '0.00';
  
  const handleContinue = () => {
    if (!amount || Number(amount) < minAmount) return;
    
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      navigate('/transaction-confirmation', { 
        state: { 
          type: 'buy',
          asset: 'USDT',
          amountKES: Number(amount),
          amountUSDT: Number(usdtAmount),
          phone
        } 
      });
    }, 1000);
  };

  return (
    <MainLayout title="Buy Crypto" showBack>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Buy USDT with M-PESA</h2>
          <p className="text-gray-600">
            Purchase USDT on the Tron blockchain
          </p>
        </div>
        
        <KashCard>
          <div className="space-y-5">
            {/* Phone Number (pre-filled and not editable) */}
            <KashInput
              label="M-PESA Phone Number"
              type="tel"
              value={phone}
              readOnly
              icon={<Phone size={18} className="text-gray-400" />}
              className="bg-gray-50"
            />
            
            {/* Amount in KES */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Amount (KES)
                </label>
                <span className="text-xs text-gray-500">
                  Min: {minAmount} KES | Max: {maxAmount} KES
                </span>
              </div>
              <KashInput
                type="number"
                placeholder="Enter amount in KES"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={<DollarSign size={18} className="text-gray-400" />}
              />
            </div>
            
            {/* Conversion Preview */}
            <div className="bg-kash-lightGray p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You will receive</span>
                <span className="text-xl font-semibold">{usdtAmount} USDT</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Exchange Rate: 1 KES = {exchangeRate} USDT
              </div>
            </div>
            
            <KashButton
              fullWidth
              disabled={!amount || Number(amount) < minAmount || loading}
              onClick={handleContinue}
            >
              {loading ? 'Processing...' : 'Continue to M-PESA'}
            </KashButton>
          </div>
        </KashCard>
        
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">How it works</h3>
          <div className="space-y-3">
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                1
              </div>
              <p className="text-sm text-gray-600">Enter the amount you want to buy in KES</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                2
              </div>
              <p className="text-sm text-gray-600">You'll receive an M-PESA prompt on your phone</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                3
              </div>
              <p className="text-sm text-gray-600">Complete the payment by entering your M-PESA PIN</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                4
              </div>
              <p className="text-sm text-gray-600">USDT will be credited to your Kash wallet immediately</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Note</h4>
          <p className="text-sm text-amber-700">
            After purchasing USDT, you can swap it for any other supported cryptocurrency in the app.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Buy;
