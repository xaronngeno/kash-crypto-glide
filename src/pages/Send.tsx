import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Search, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useWallets } from '@/hooks/useWallets';
import { validateAddressForNetwork, detectNetworkFromAddress } from '@/utils/addressValidator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

enum SendStep {
  SELECT_COIN = 'select_coin',
  SELECT_NETWORK = 'select_network',
  ENTER_DETAILS = 'enter_details'
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  networks?: string[];
  balance?: number;
  value?: number;
  logo?: string;
}

const getCurrencyLogo = (symbol: string) => {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
    case 'ETH':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'SOL':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'TRX':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'USDT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
    case 'BNB':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'MATIC':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
  }
};

const getNetworkLogo = (blockchain: string) => {
  switch (blockchain.toLowerCase()) {
    case 'bitcoin':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
    case 'ethereum':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'solana':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'tron':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'binance smart chain':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'polygon':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
  }
};

const NetworkBadge = ({ network }: { network: string }) => {
  let color = "bg-gray-100 text-gray-600";
  
  switch (network.toLowerCase()) {
    case 'bitcoin':
      color = "bg-amber-100 text-amber-600";
      break;
    case 'ethereum':
      color = "bg-indigo-100 text-indigo-600";
      break;
    case 'solana':
      color = "bg-purple-100 text-purple-600";
      break;
    case 'tron':
      color = "bg-red-100 text-red-600";
      break;
    case 'binance smart chain':
      color = "bg-yellow-100 text-yellow-700";
      break;
    case 'polygon':
      color = "bg-blue-100 text-blue-600";
      break;
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color} font-medium`}>
      {network}
    </span>
  );
};

const getNetworksForCurrency = (symbol: string): string[] => {
  switch(symbol.toUpperCase()) {
    case 'BTC':
      return ['Bitcoin'];
    case 'ETH':
      return ['Ethereum'];
    case 'USDT':
      return ['Ethereum', 'Tron', 'Binance Smart Chain', 'Solana', 'Polygon'];
    case 'SOL':
      return ['Solana'];
    case 'TRX':
      return ['Tron'];
    case 'BNB':
      return ['Binance Smart Chain'];
    case 'MATIC':
      return ['Polygon'];
    default:
      return ['Ethereum'];
  }
};

const Send = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prices } = useCryptoPrices();
  const { assets } = useWallets({ prices });
  
  const [currentStep, setCurrentStep] = useState<SendStep>(SendStep.SELECT_COIN);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [possibleNetwork, setPossibleNetwork] = useState<string | null>(null);
  
  useEffect(() => {
    if (assets.length > 0) {
      const tokens: Token[] = assets.map(asset => {
        const networks = getNetworksForCurrency(asset.symbol);
        
        return {
          id: asset.symbol,
          name: asset.name || asset.symbol,
          symbol: asset.symbol,
          icon: asset.symbol[0],
          decimals: 8,
          networks,
          balance: asset.amount,
          value: asset.value,
          logo: getCurrencyLogo(asset.symbol)
        };
      });
      
      setAvailableTokens(tokens);
    }
  }, [assets]);
  
  const calculateFee = (symbol: string, network: string) => {
    const feeMap: Record<string, Record<string, number>> = {
      BTC: { Bitcoin: 0.0001 },
      ETH: { Ethereum: 0.002 },
      USDT: { 
        Ethereum: 5,
        'Tron': 1,
        'Binance Smart Chain': 0.5
      },
      SOL: { Solana: 0.01 },
      BNB: { 'Binance Smart Chain': 0.0005 },
      MATIC: { Polygon: 0.01 }
    };
    
    return feeMap[symbol]?.[network] || 0.001;
  };
  
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setSelectedNetwork(null);
    setCurrentStep(SendStep.SELECT_NETWORK);
  };
  
  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    setCurrentStep(SendStep.ENTER_DETAILS);
  };
  
  const resetFlow = () => {
    setCurrentStep(SendStep.SELECT_COIN);
    setSelectedToken(null);
    setSelectedNetwork(null);
    setAmount('');
    setRecipient('');
    setMemo('');
  };
  
  const handleSetMax = () => {
    if (selectedToken && selectedNetwork) {
      const fee = calculateFee(selectedToken.symbol, selectedNetwork);
      const maxAmount = Math.max(0, (selectedToken.balance || 0) - fee);
      setAmount(maxAmount.toString());
    }
  };
  
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    setAddressError(null);
    setPossibleNetwork(null);
    
    if (address.length > 10 && selectedNetwork) {
      const isValid = validateAddressForNetwork(address, selectedNetwork);
      
      if (!isValid) {
        const detectedNetwork = detectNetworkFromAddress(address);
        
        if (detectedNetwork) {
          setPossibleNetwork(detectedNetwork);
          setAddressError(`This appears to be a ${detectedNetwork} address, not a ${selectedNetwork} address.`);
        } else {
          setAddressError(`This doesn't appear to be a valid ${selectedNetwork} address.`);
        }
      }
    }
  };
  
  const handleContinue = () => {
    if (!selectedToken || !selectedNetwork || !amount || !recipient) return;
    
    const isValidAddress = validateAddressForNetwork(recipient, selectedNetwork);
    
    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: `The address you entered doesn't match the ${selectedNetwork} network format.`,
        variant: "destructive"
      });
      return;
    }
    
    const fee = calculateFee(selectedToken.symbol, selectedNetwork);
    
    navigate('/transaction-confirmation', { 
      state: { 
        type: 'send',
        asset: {
          ...selectedToken,
          blockchain: selectedNetwork
        },
        amount: parseFloat(amount),
        recipient,
        fee,
        memo,
        network: selectedNetwork
      } 
    });
  };

  return (
    <MainLayout title="Send" showBack>
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-1">Send Crypto</h2>
          {currentStep === SendStep.SELECT_COIN && (
            <p className="text-gray-600">Select a cryptocurrency to send</p>
          )}
          {currentStep === SendStep.SELECT_NETWORK && (
            <p className="text-gray-600">Select network for {selectedToken?.symbol}</p>
          )}
          {currentStep === SendStep.ENTER_DETAILS && (
            <p className="text-gray-600">
              Enter recipient and amount
            </p>
          )}
        </div>

        {currentStep === SendStep.SELECT_COIN && (
          <KashCard className="p-5">
            <div className="mb-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableTokens
                  .filter(token => 
                    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={token.logo} alt={token.name} />
                          <AvatarFallback>{token.symbol[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{token.symbol}</h3>
                          <p className="text-sm text-gray-500">{token.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-2">
                          <p className="font-medium">{token.balance?.toLocaleString('en-US', { maximumFractionDigits: 6 })}</p>
                          {token.value && (
                            <p className="text-sm text-gray-500">${token.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                          )}
                        </div>
                        <ArrowRight size={18} className="text-gray-400" />
                      </div>
                    </div>
                  ))
                }
                
                {availableTokens.filter(token => 
                  token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cryptocurrencies found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          </KashCard>
        )}

        {currentStep === SendStep.SELECT_NETWORK && selectedToken && (
          <KashCard className="p-5">
            <div className="flex items-center mb-6">
              <KashButton 
                variant="ghost" 
                size="sm" 
                onClick={resetFlow}
                className="mr-2"
              >
                Back
              </KashButton>
              
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={selectedToken.logo} alt={selectedToken.symbol} />
                  <AvatarFallback>{selectedToken.symbol[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-medium">{selectedToken.symbol}</h3>
              </div>
            </div>

            <h3 className="font-medium mb-3">Select Network</h3>
            <div className="space-y-2">
              {selectedToken.networks?.map((network) => (
                <div
                  key={network}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNetworkSelect(network)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getNetworkLogo(network)} alt={network} />
                      <AvatarFallback>{network[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{network}</h3>
                      <p className="text-xs text-gray-500">
                        Fee: ~{calculateFee(selectedToken.symbol, network)} {selectedToken.symbol}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400" />
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start">
                <Info size={18} className="text-blue-500 mr-2 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Make sure to select the network that matches the recipient's address. Sending to the wrong network may result in lost funds.
                </p>
              </div>
            </div>
          </KashCard>
        )}

        {currentStep === SendStep.ENTER_DETAILS && selectedToken && selectedNetwork && (
          <KashCard className="p-5">
            <div className="flex items-center mb-6">
              <KashButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentStep(SendStep.SELECT_NETWORK)}
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
                    {calculateFee(selectedToken.symbol, selectedNetwork)} {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Total Amount</span>
                  <span>
                    {amount ? (parseFloat(amount) + calculateFee(selectedToken.symbol, selectedNetwork)).toFixed(6) : calculateFee(selectedToken.symbol, selectedNetwork)} {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <KashButton
                fullWidth
                disabled={!amount || !recipient || parseFloat(amount) <= 0 || parseFloat(amount) > (selectedToken.balance || 0) || !!addressError}
                onClick={handleContinue}
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
        )}
      </div>
    </MainLayout>
  );
};

export default Send;
