
import { useState } from 'react';
import { Wallet, AlertTriangle } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashCard } from '@/components/ui/KashCard';
import { KashInput } from '@/components/ui/KashInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Token, calculateFee } from '@/utils/tokenUtils';
import NetworkBadge from './NetworkBadge';

interface EnterDetailsProps {
  selectedToken: Token;
  selectedNetwork: string;
  onBack: () => void;
  onContinue: (amount: string, recipient: string, memo: string) => void;
  validateAddress: (address: string) => { isValid: boolean; detectedNetwork: string | null; errorMessage: string | null };
}

const EnterDetails = ({ 
  selectedToken, 
  selectedNetwork, 
  onBack, 
  onContinue,
  validateAddress
}: EnterDetailsProps) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [possibleNetwork, setPossibleNetwork] = useState<string | null>(null);
  
  const handleSetMax = () => {
    const fee = calculateFee(selectedToken.symbol, selectedNetwork);
    const maxAmount = Math.max(0, (selectedToken.balance || 0) - fee);
    setAmount(maxAmount.toString());
  };
  
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    
    if (address.length > 10) {
      const { isValid, detectedNetwork, errorMessage } = validateAddress(address);
      
      if (!isValid) {
        setPossibleNetwork(detectedNetwork);
        setAddressError(errorMessage);
      } else {
        setAddressError(null);
        setPossibleNetwork(null);
      }
    } else {
      setAddressError(null);
      setPossibleNetwork(null);
    }
  };
  
  const fee = calculateFee(selectedToken.symbol, selectedNetwork);
  const totalAmount = amount ? parseFloat(amount) + fee : fee;
  const isValid = !!amount && !!recipient && parseFloat(amount) > 0 && 
    parseFloat(amount) <= (selectedToken.balance || 0) && !addressError;

  return (
    <KashCard className="p-5">
      <div className="flex items-center mb-6">
        <KashButton 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-2"
        >
          Back
        </KashButton>
        
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={selectedToken.logo} alt={selectedToken.symbol} />
            <AvatarFallback>{selectedToken.symbol[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center">
            <h3 className="font-medium mr-2">{selectedToken.symbol}</h3>
            <NetworkBadge network={selectedNetwork} />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <KashInput
            label="Recipient Address"
            placeholder={`Enter ${selectedToken.symbol} address for ${selectedNetwork}`}
            value={recipient}
            onChange={handleRecipientChange}
            icon={<Wallet size={18} className="text-gray-400" />}
            error={addressError || undefined}
          />
          
          {possibleNetwork && addressError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {addressError} Sending to the wrong network may result in permanent loss of funds.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <span className="text-xs text-gray-500">
              Available: {selectedToken.balance?.toLocaleString('en-US', { maximumFractionDigits: 8 })} {selectedToken.symbol}
            </span>
          </div>
          <div className="relative">
            <KashInput
              type="number"
              placeholder={`0.00 ${selectedToken.symbol}`}
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

        <KashInput
          label="Memo (Optional)"
          placeholder="Add a note to this transaction"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Network Fee</span>
            <span className="font-medium">
              {fee} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">Total Amount</span>
            <span>
              {totalAmount.toFixed(6)} {selectedToken.symbol}
            </span>
          </div>
        </div>

        <KashButton
          fullWidth
          disabled={!isValid}
          onClick={() => onContinue(amount, recipient, memo)}
        >
          Continue
        </KashButton>
      </div>
      
      <div className="mt-5 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <h4 className="font-medium text-amber-700 mb-1">Important</h4>
        <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
          <li>Verify the recipient address carefully before sending</li>
          <li>Transactions cannot be reversed once confirmed</li>
          <li>Always start with a small test amount for new addresses</li>
          <li>Make sure you are sending to a {selectedToken.symbol} address on the {selectedNetwork} network</li>
        </ul>
      </div>
    </KashCard>
  );
};

export default EnterDetails;
