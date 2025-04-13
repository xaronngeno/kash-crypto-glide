
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, QrCode, Info, Wallet, ArrowRight, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import TokenSelector from '@/components/swap/TokenSelector';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KashInput } from '@/components/ui/KashInput';
import { Badge } from '@/components/ui/badge';

interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
  wallet_type?: string;
  logo?: string;
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  logo?: string;
  networks?: string[];
}

enum ReceiveStep {
  SELECT_COIN = 'select_coin',
  SELECT_NETWORK = 'select_network',
  VIEW_ADDRESS = 'view_address'
}

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

interface NetworkBadgeProps {
  network: string;
  className?: string;
}

const NetworkBadge = ({ network, className }: NetworkBadgeProps) => {
  let color = "bg-gray-100 text-gray-500";
  
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
    <span className={`text-xs px-2 py-0.5 rounded-full ${color} font-medium ${className}`}>
      {network}
    </span>
  );
};

const WalletTypeBadge = ({ type, className }: { type: string, className?: string }) => {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium ${className}`}>
      {type}
    </span>
  );
};

const Receive = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prices } = useCryptoPrices();
  
  const [currentStep, setCurrentStep] = useState<ReceiveStep>(ReceiveStep.SELECT_COIN);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noWalletsFound, setNoWalletsFound] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);

  const supportedNetworks = [
    'Bitcoin', 
    'Ethereum', 
    'Solana', 
    'Tron', 
    'Binance Smart Chain', 
    'Polygon'
  ];
  
  const solanaCompatibleTokens = ['SOL', 'USDT', 'USDC'];
  const bitcoinCompatibleTokens = ['BTC'];

  useEffect(() => {
    if (walletAddresses.length > 0) {
      console.log("Processing wallet addresses:", walletAddresses);
      const tokenMap = new Map<string, Token>();
      
      walletAddresses.forEach(wallet => {
        const existingToken = tokenMap.get(wallet.symbol);
        
        if (existingToken) {
          if (!existingToken.networks?.includes(wallet.blockchain)) {
            existingToken.networks = [...(existingToken.networks || []), wallet.blockchain];
          }
          
          tokenMap.set(wallet.symbol, existingToken);
        } else {
          tokenMap.set(wallet.symbol, {
            id: wallet.symbol,
            name: wallet.symbol,
            symbol: wallet.symbol,
            icon: wallet.symbol[0],
            decimals: 8,
            logo: getCurrencyLogo(wallet.symbol),
            networks: [wallet.blockchain]
          });
        }
      });
      
      const processedTokens = Array.from(tokenMap.values());
      console.log("Processed tokens:", processedTokens);
      setAvailableTokens(processedTokens);
      
      if (!selectedToken && tokenMap.size > 0) {
        setSelectedToken(Array.from(tokenMap.values())[0]);
      }
    }
  }, [walletAddresses]);

  useEffect(() => {
    if (selectedToken && currentStep === ReceiveStep.SELECT_NETWORK) {
      if (selectedToken.networks?.length === 1) {
        setSelectedNetwork(selectedToken.networks[0]);
        
        const wallet = walletAddresses.find(
          w => w.symbol === selectedToken.symbol && w.blockchain === selectedToken.networks[0]
        );
        
        if (wallet) {
          setSelectedWallet(wallet);
          setCurrentStep(ReceiveStep.VIEW_ADDRESS);
        }
      }
    }
  }, [selectedToken, currentStep, walletAddresses]);

  const createWallets = async () => {
    if (!user || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Creating wallets for user:", user.id);
      
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      
      const { data: wallets, error: fetchError } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (wallets && wallets.success && wallets.wallets && wallets.wallets.length > 0) {
        const btcWallets = wallets.wallets.filter(w => w.currency === 'BTC');
        console.log("BTC wallets after creation:", btcWallets);
        
        const addresses: WalletAddress[] = wallets.wallets.map(wallet => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency)
        }));
        
        setWalletAddresses(addresses);
        setNoWalletsFound(false);
        
        toast({
          title: "Wallets created",
          description: "Your wallets have been created successfully.",
        });
      } else {
        setNoWalletsFound(true);
        throw new Error("No wallets were created");
      }
    } catch (error) {
      console.error("Error creating wallets:", error);
      toast({
        title: "Error creating wallets",
        description: "Failed to create wallets. Please try again later.",
        variant: "destructive"
      });
      setNoWalletsFound(true);
    } finally {
      setCreatingWallets(false);
    }
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setSelectedNetwork(null);
    setSelectedWallet(null);
    setCurrentStep(ReceiveStep.SELECT_NETWORK);
  };

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    
    const wallet = walletAddresses.find(
      w => w.symbol === selectedToken?.symbol && w.blockchain === network
    );
    
    if (wallet) {
      setSelectedWallet(wallet);
      setCurrentStep(ReceiveStep.VIEW_ADDRESS);
    } else {
      toast({
        title: "Wallet not found",
        description: `We couldn't find a wallet for ${selectedToken?.symbol} on ${network}.`,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const resetFlow = () => {
    setCurrentStep(ReceiveStep.SELECT_COIN);
    setSelectedNetwork(null);
    setSelectedWallet(null);
  };

  const filterTokens = (tokens: Token[]) => {
    if (!searchTerm) {
      return tokens;
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return tokens.filter(token => {
      const nameMatch = token.name.toLowerCase().includes(lowercaseSearch);
      const symbolMatch = token.symbol.toLowerCase().includes(lowercaseSearch);
      
      const isBitcoinSearch = 
        lowercaseSearch === 'bitcoin' || 
        lowercaseSearch === 'btc' || 
        lowercaseSearch.includes('bitcoin') || 
        lowercaseSearch.includes('btc');
      
      const isBitcoinToken = token.symbol.toLowerCase() === 'btc';
      
      return nameMatch || symbolMatch || (isBitcoinSearch && isBitcoinToken);
    });
  };

  useEffect(() => {
    const fetchWalletAddresses = async () => {
      if (!user) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching wallet addresses for user:", user.id);

        const { data: wallets, error } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (error) {
          throw new Error(`Failed to fetch wallet balances: ${error.message}`);
        }
        
        if (wallets && wallets.success && wallets.wallets && wallets.wallets.length > 0) {
          console.log("Fetched wallet addresses:", wallets.wallets);
          
          // Check if user has Bitcoin wallets specifically
          const btcWallets = wallets.wallets.filter(w => w.currency === 'BTC');
          console.log("BTC wallets found:", btcWallets);
          console.log("Has Bitcoin BTC:", btcWallets.length > 0);
          
          const addresses: WalletAddress[] = wallets.wallets.map(wallet => ({
            blockchain: wallet.blockchain,
            symbol: wallet.currency,
            address: wallet.address,
            wallet_type: wallet.wallet_type,
            logo: getCurrencyLogo(wallet.currency)
          }));
          
          setWalletAddresses(addresses);
          setNoWalletsFound(false);
        } else {
          console.log("No wallets found, showing create wallet option");
          setNoWalletsFound(true);
        }
      } catch (error) {
        console.error("Error fetching wallet addresses:", error);
        setNoWalletsFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddresses();
  }, [user]);

  // Render functions for different steps
  const renderSelectCoin = () => (
    <div className="space-y-6">
      <div className="relative">
        <div className="relative">
          <KashInput
            placeholder="Search coins"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {loading ? (
        <div className="py-10 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <Wallet className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Loading your wallets...</p>
          </div>
        </div>
      ) : noWalletsFound ? (
        <div className="py-8 text-center">
          <Wallet className="h-10 w-10 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium text-lg mb-2">No wallets found</h3>
          <p className="text-gray-500 mb-4">You need to create wallets before receiving crypto.</p>
          <KashButton 
            onClick={createWallets}
            loading={creatingWallets}
            disabled={creatingWallets}
          >
            Create Wallets
          </KashButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filterTokens(availableTokens).length > 0 ? (
            filterTokens(availableTokens).map((token) => (
              <KashCard
                key={token.id}
                onClick={() => handleTokenSelect(token)} 
                className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={token.logo} alt={token.name} />
                  <AvatarFallback>{token.icon}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h3 className="font-medium">{token.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {token.networks?.map(network => (
                      <NetworkBadge key={network} network={network} />
                    ))}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </KashCard>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No coins match your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSelectNetwork = () => (
    <div className="space-y-6">
      <KashCard className="p-4 flex items-center mb-4">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={selectedToken?.logo} alt={selectedToken?.name} />
          <AvatarFallback>{selectedToken?.icon}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h3 className="font-medium">{selectedToken?.name}</h3>
        </div>
      </KashCard>
      
      <h3 className="font-medium text-lg">Select Network</h3>
      <p className="text-gray-500 text-sm">Choose which network you want to receive {selectedToken?.symbol} on</p>
      
      <div className="grid grid-cols-1 gap-2 mt-4">
        {selectedToken?.networks?.map((network) => (
          <KashCard
            key={network}
            onClick={() => handleNetworkSelect(network)} 
            className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={getNetworkLogo(network)} alt={network} />
              <AvatarFallback>{network.substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h3 className="font-medium">{network}</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </KashCard>
        ))}
      </div>
      
      <div className="flex justify-center mt-4">
        <KashButton variant="outline" onClick={resetFlow}>
          Back
        </KashButton>
      </div>
    </div>
  );

  const renderViewAddress = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Receive {selectedToken?.symbol}</h3>
        <Select
          value={selectedNetwork || undefined}
          onValueChange={(value) => handleNetworkSelect(value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Network" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectedToken?.networks?.map((network) => (
                <SelectItem key={network} value={network}>{network}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={selectedToken?.logo} alt={selectedToken?.name} />
              <AvatarFallback>{selectedToken?.icon}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedToken?.symbol}</h3>
              <NetworkBadge network={selectedNetwork || ''} className="mt-1" />
              {selectedWallet?.wallet_type && (
                <WalletTypeBadge type={selectedWallet.wallet_type} className="ml-1" />
              )}
            </div>
          </div>
          <KashButton 
            variant="outline" 
            size="sm" 
            onClick={() => setShowQR(!showQR)}
          >
            {showQR ? 'Hide QR' : 'Show QR'}
            <QrCode className="ml-1 h-4 w-4" />
          </KashButton>
        </div>
        
        {showQR && (
          <div className="flex justify-center my-6 bg-white p-4 rounded-lg border">
            <QRCodeSVG
              value={selectedWallet?.address || ''}
              size={200}
              level="H"
              includeMargin
              className="max-w-full"
            />
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-3 break-all font-mono text-sm relative">
          {selectedWallet?.address}
          <button
            onClick={() => copyToClipboard(selectedWallet?.address || '')}
            className="absolute right-2 top-3 text-gray-500 hover:text-gray-800"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-6 flex flex-col space-y-2">
          <div className="bg-yellow-50 rounded-lg p-3 flex items-start">
            <Info className="text-yellow-600 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-600">
              <span className="font-semibold">Important:</span> Only send {selectedToken?.symbol} on the {selectedNetwork} network to this address. Sending other cryptocurrencies may result in permanent loss.
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <KashButton variant="outline" onClick={resetFlow}>
          Back to Coins
        </KashButton>
      </div>
    </div>
  );

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case ReceiveStep.SELECT_COIN:
        return renderSelectCoin();
      case ReceiveStep.SELECT_NETWORK:
        return renderSelectNetwork();
      case ReceiveStep.VIEW_ADDRESS:
        return renderViewAddress();
      default:
        return renderSelectCoin();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Receive Crypto</h1>
        {renderCurrentStep()}
      </div>
    </MainLayout>
  );
};

export default Receive;
