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
import { refreshWalletBalances } from '@/hooks/wallet';
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
    case 'ethereum':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'solana':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    default:
      return '/placeholder.svg';
  }
};

const getCurrencyLogo = (symbol: string) => {
  switch (symbol.toUpperCase()) {
    case 'ETH':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'SOL':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'USDT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
    default:
      return '/placeholder.svg';
  }
};

interface NetworkBadgeProps {
  network: string;
  className?: string;
}

const NetworkBadge = ({ network, className }: NetworkBadgeProps) => {
  let color = "bg-gray-100 text-gray-500";
  
  switch (network.toLowerCase()) {
    case 'ethereum':
      color = "bg-indigo-100 text-indigo-600";
      break;
    case 'solana':
      color = "bg-purple-100 text-purple-600";
      break;
    default:
      color = "bg-gray-100 text-gray-500";
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
    'Ethereum', 
    'Solana'
  ];
  
  const solanaCompatibleTokens = ['SOL', 'USDT', 'USDC'];

  useEffect(() => {
    if (walletAddresses.length > 0) {
      console.log("Processing wallet addresses:", walletAddresses);
      
      const filteredAddresses = walletAddresses.filter(
        wallet => wallet.blockchain !== 'Bitcoin' && wallet.symbol !== 'BTC'
      );
      
      const tokenMap = new Map<string, Token>();
      
      filteredAddresses.forEach(wallet => {
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
            decimals: wallet.symbol === 'SOL' ? 9 : 18,
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
        const filteredWallets = wallets.wallets.filter(
          w => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
        );
        
        const addresses: WalletAddress[] = filteredWallets.map(wallet => ({
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
      return nameMatch || symbolMatch;
    });
  };

  const handleTryAgain = async () => {
    if (!user || !user.id) return;
    
    setLoading(true);
    
    try {
      toast({
        title: "Refreshing wallets",
        description: "Attempting to regenerate wallet addresses...",
      });
      
      await refreshWalletBalances(user.id);
      
      const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId: user.id, forceRefresh: true }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.success && data.wallets && data.wallets.length > 0) {
        const filteredWallets = data.wallets.filter(
          w => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
        );
        
        console.log("Refreshed wallet addresses:", filteredWallets);
        
        const addresses: WalletAddress[] = filteredWallets.map(wallet => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency)
        }));
        
        setWalletAddresses(addresses);
        
        if (currentStep === ReceiveStep.VIEW_ADDRESS && selectedWallet && selectedToken) {
          const refreshedWallet = addresses.find(
            w => w.symbol === selectedToken.symbol && w.blockchain === selectedNetwork
          );
          
          if (refreshedWallet) {
            setSelectedWallet(refreshedWallet);
          }
        }
        
        toast({
          title: "Wallets refreshed",
          description: "Your wallet addresses have been updated.",
        });
      } else {
        throw new Error("No wallets found after refresh");
      }
    } catch (error) {
      console.error("Error refreshing wallets:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh wallet addresses. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        
        const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (error) {
          throw error;
        }

        if (data && data.success && data.wallets && data.wallets.length > 0) {
          const filteredWallets = data.wallets.filter(
            w => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
          );
          
          console.log("Fetched wallet addresses:", filteredWallets);
          
          const addresses: WalletAddress[] = filteredWallets.map(wallet => ({
            blockchain: wallet.blockchain,
            symbol: wallet.currency,
            address: wallet.address,
            logo: getCurrencyLogo(wallet.currency)
          }));
          
          setWalletAddresses(addresses);
          setNoWalletsFound(addresses.length === 0);
          
          if (addresses.length === 0) {
            console.log("No supported wallets found for user, attempting to create wallets");
            await createWallets();
          }
        } else {
          console.log("No wallets found for user, attempting to create wallets");
          await createWallets();
        }
      } catch (error) {
        console.error("Error fetching wallet addresses:", error);
        toast({
          title: "Error fetching wallets",
          description: "There was a problem loading your wallets. Please try again later.",
          variant: "destructive"
        });
        setNoWalletsFound(true);
        setWalletAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddresses();
  }, [user, toast]);

  if (loading) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <p className="text-gray-600">Loading your wallets...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (creatingWallets) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <p className="text-gray-600">Creating your wallets...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (noWalletsFound) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 w-full">
            <h3 className="font-medium text-amber-700 mb-2">No Wallets Found</h3>
            <p className="text-amber-700 text-sm mb-4">
              Your account doesn't have any wallets set up yet.
            </p>
            <KashButton 
              onClick={createWallets} 
              disabled={creatingWallets}
            >
              Create My Wallets
            </KashButton>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Receive" showBack>
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-1">Receive Crypto</h2>
          {currentStep === ReceiveStep.SELECT_COIN && (
            <p className="text-gray-600">Select a cryptocurrency to receive</p>
          )}
          {currentStep === ReceiveStep.SELECT_NETWORK && (
            <p className="text-gray-600">Select network for {selectedToken?.symbol}</p>
          )}
          {currentStep === ReceiveStep.VIEW_ADDRESS && (
            <p className="text-gray-600">
              {selectedToken?.symbol} address on {selectedNetwork}
            </p>
          )}
        </div>

        {currentStep === ReceiveStep.SELECT_COIN && (
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
                {filterTokens(availableTokens).map((token) => (
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
                      {prices[token.symbol] && (
                        <span className="text-sm text-gray-500 mr-2">
                          ${prices[token.symbol].price.toLocaleString()}
                        </span>
                      )}
                      <ArrowRight size={18} className="text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {filterTokens(availableTokens).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cryptocurrencies found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          </KashCard>
        )}

        {currentStep === ReceiveStep.SELECT_NETWORK && selectedToken && (
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
                    <div className="flex items-center">
                      <h3 className="font-medium">{network}</h3>
                      <NetworkBadge network={network} className="ml-2" />
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
                  Make sure to select the correct network. Sending assets on the wrong network may result in permanent loss.
                </p>
              </div>
            </div>
          </KashCard>
        )}

        {currentStep === ReceiveStep.VIEW_ADDRESS && selectedWallet && (
          <KashCard className="p-5">
            <div className="flex items-center mb-6">
              <KashButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentStep(ReceiveStep.SELECT_NETWORK)}
                className="mr-2"
              >
                Back
              </KashButton>
              
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={selectedWallet.logo} alt={selectedWallet.symbol} />
                  <AvatarFallback>{selectedWallet.symbol[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center">
                  <h3 className="font-medium mr-2">{selectedWallet.symbol}</h3>
                  <NetworkBadge network={selectedWallet.blockchain} />
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block mb-3">
                <NetworkBadge network={selectedWallet.blockchain} />
              </div>
              
              {!selectedWallet.address || selectedWallet.address.trim() === "" ? (
                <div className="bg-amber-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Info size={20} className="text-amber-500 mr-2" />
                    <h3 className="font-medium text-amber-700">Address Not Available</h3>
                  </div>
                  <p className="text-amber-600 mb-3">
                    There was an issue retrieving your {selectedWallet.symbol} address.
                  </p>
                  <KashButton 
                    onClick={handleTryAgain}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </KashButton>
                </div>
              ) : showQR ? (
                <div className="mb-4 flex justify-center">
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <QRCodeSVG 
                      value={selectedWallet.address}
                      size={180}
                      level="H"
                      includeMargin={true}
                      className="w-full h-full"
                    />
                    <div className="mt-2 text-xs text-center">
                      <NetworkBadge network={selectedWallet.blockchain} />
                      <p className="text-gray-500 mt-1 break-all px-2">
                        {selectedWallet.address}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 relative">
                    <div className="absolute top-0 right-0 mt-2 mr-2 flex">
                      <NetworkBadge network={selectedWallet.blockchain} />
                    </div>
                    <p className="break-all text-sm font-mono border-gray-100 pt-4">
                      {selectedWallet.address}
                    </p>
                  </div>
                </>
              )}
              
              {selectedWallet.address && selectedWallet.address.trim() !== "" && (
                <div className="flex space-x-2">
                  <KashButton 
                    variant="outline"
                    fullWidth
                    icon={<Copy size={18} />}
                    onClick={() => copyToClipboard(selectedWallet.address)}
                  >
                    Copy
                  </KashButton>
                  <KashButton 
                    variant="outline"
                    fullWidth
                    icon={<QrCode size={18} />}
                    onClick={() => setShowQR(!showQR)}
                  >
                    {showQR ? "Hide QR" : "Show QR"}
                  </KashButton>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="font-medium text-amber-700 flex items-center mb-1">
                <Info size={16} className="mr-1" />
                Important Network Information
              </h4>
              <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                <li>Only send {selectedWallet.symbol} on the <strong>{selectedWallet.blockchain}</strong> network to this address</li>
                <li>Sending any other cryptocurrency or using the wrong network may result in permanent loss</li>
                <li>Always verify the entire address before sending any funds</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <KashButton 
                variant="outline"
                fullWidth
                onClick={resetFlow}
              >
                Receive Different Coin
              </KashButton>
            </div>
          </KashCard>
        )}
      </div>
    </MainLayout>
  );
};

export default Receive;
