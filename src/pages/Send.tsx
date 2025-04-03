
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';

// Mock data
const cryptoAssets = [
  { id: 1, name: 'Bitcoin', symbol: 'BTC', balance: 0.023, icon: '₿' },
  { id: 2, name: 'Ethereum', symbol: 'ETH', balance: 1.5, icon: 'Ξ' },
  { id: 3, name: 'USDT', symbol: 'USDT', balance: 2500, icon: '₮' },
  { id: 4, name: 'Solana', symbol: 'SOL', balance: 10, icon: 'Ѕ' },
];

const Send = () => {
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState(cryptoAssets[0]);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');
  
  // Calculate fee (this would be dynamic in a real app)
  const fee = selectedAsset.symbol === 'BTC' ? 0.0001 : 
              selectedAsset.symbol === 'ETH' ? 0.002 : 
              selectedAsset.symbol === 'USDT' ? 1 : 0.01;
  
  const maxAmount = Math.max(0, selectedAsset.balance - fee);
  
  const handleContinue = () => {
    if (!amount || !recipient) return;
    
    navigate('/transaction-confirmation', { 
      state: { 
        type: 'send',
        asset: selectedAsset,
        amount: parseFloat(amount),
        recipient,
        fee,
        memo
      } 
    });
  };
  
  const handleSetMax = () => {
    setAmount(maxAmount.toString());
  };

  return (
    <MainLayout title="Send" showBack>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Send Crypto</h2>
          <p className="text-gray-600">
            Enter recipient address and amount
          </p>
        </div>

        <KashCard>
          <div className="space-y-5">
            {/* Asset Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Asset
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cryptoAssets.map(asset => (
                  <button
                    key={asset.id}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors
                      ${selectedAsset.id === asset.id 
                        ? 'border-kash-green bg-kash-green/5' 
                        : 'border-gray-200 hover:bg-kash-lightGray'}`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <span className="text-xl font-bold">{asset.icon}</span>
                    <span className="text-sm font-medium">{asset.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <KashInput
              label="Recipient Address"
              placeholder={`Enter ${selectedAsset.symbol} address`}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              icon={<Wallet size={18} className="text-gray-400" />}
            />

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <span className="text-xs text-gray-500">
                  Available: {selectedAsset.balance} {selectedAsset.symbol}
                </span>
              </div>
              <div className="relative">
                <KashInput
                  type="number"
                  placeholder={`0.00 ${selectedAsset.symbol}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kash-green font-medium"
                  onClick={handleSetMax}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Memo/Tag (optional) */}
            <KashInput
              label="Memo (Optional)"
              placeholder="Add a note to this transaction"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            
            {/* Fee Information */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Transaction Fee</span>
                <span className="font-medium">{fee} {selectedAsset.symbol}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-600">Total Amount</span>
                <span>
                  {amount ? (parseFloat(amount) + fee).toFixed(6) : fee} {selectedAsset.symbol}
                </span>
              </div>
            </div>

            <KashButton
              fullWidth
              disabled={!amount || !recipient || parseFloat(amount) > maxAmount}
              onClick={handleContinue}
            >
              Continue
            </KashButton>
          </div>
        </KashCard>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Important</h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
            <li>Verify the recipient address carefully before sending</li>
            <li>Transactions cannot be reversed once confirmed</li>
            <li>Always start with a small test amount for new addresses</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Send;
