
import { useState, useEffect } from 'react';
import { Copy, QrCode, Info, Search, Loader2, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAIN_CURRENCIES = ['ETH', 'SOL', 'TRX', 'SUI', 'MONAD'];

interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
  logo?: string;
  wallet_type?: string;
}

const getNetworkLogo = (blockchain: string) => {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'solana':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'tron':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'sui':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png';
    case 'binance smart chain':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'polygon':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    case 'monad':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/24103.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  }
};

const getCurrencyLogo = (symbol: string) => {
  switch (symbol.toUpperCase()) {
    case 'ETH':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'SOL':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'TRX':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'SUI':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png';
    case 'USDT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
    case 'BNB':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'MATIC':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    case 'MONAD':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/24103.png';
    case 'XRP':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png';
    case 'ADA':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png';
    case 'DOT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png';
    case 'DOGE':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png';
    case 'LINK':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
  }
};

const NetworkBadge = ({ network }: { network: string }) => {
  let color = "bg-gray-100 text-gray-600";
  
  switch (network.toLowerCase()) {
    case 'ethereum':
      color = "bg-indigo-100 text-indigo-600";
      break;
    case 'solana':
      color = "bg-purple-100 text-purple-600";
      break;
    case 'tron':
      color = "bg-red-100 text-red-600";
      break;
    case 'sui':
      color = "bg-blue-100 text-blue-700";
      break;
    case 'binance smart chain':
      color = "bg-yellow-100 text-yellow-700";
      break;
    case 'polygon':
      color = "bg-blue-100 text-blue-600";
      break;
    case 'monad':
      color = "bg-green-100 text-green-600";
      break;
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color} font-medium`}>
      {network}
    </span>
  );
};

const Receive = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedChain, setSelectedChain] = useState<WalletAddress | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noWalletsFound, setNoWalletsFound] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedWallets, setDisplayedWallets] = useState<WalletAddress[]>([]);
  const [groupedWallets, setGroupedWallets] = useState<Record<string, WalletAddress[]>>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [missingCurrencies, setMissingCurrencies] = useState<string[]>([]);

  useEffect(() => {
    if (walletAddresses.length > 0) {
      const grouped: Record<string, WalletAddress[]> = {};
      
      walletAddresses.forEach(wallet => {
        if (!grouped[wallet.symbol]) {
          grouped[wallet.symbol] = [];
        }
        grouped[wallet.symbol].push({
          ...wallet,
          logo: getCurrencyLogo(wallet.symbol)
        });
      });
      
      setGroupedWallets(grouped);
      
      const existingSymbols = new Set(Object.keys(grouped));
      const missing = MAIN_CURRENCIES.filter(c => !existingSymbols.has(c));
      setMissingCurrencies(missing);
      
      console.log("Grouped wallets:", grouped); // Debug log
    }
  }, [walletAddresses]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = walletAddresses.filter(wallet => 
        wallet.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        wallet.blockchain.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedWallets(filtered);
    } else {
      setDisplayedWallets(walletAddresses);
    }
  }, [searchTerm, walletAddresses]);

  useEffect(() => {
    const fetchWalletAddresses = async () => {
      if (!user) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setFetchError(null);
        console.log("Fetching wallet addresses for user:", user.id);
        
        const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (error) {
          throw error;
        }

        setDebugInfo(data);
        console.log("Received wallet data from function:", data);
        
        if (data && data.success && data.wallets && data.wallets.length > 0) {
          console.log("Fetched wallet addresses from function:", data.wallets);
          
          const addresses: WalletAddress[] = [];
          
          data.wallets.forEach((wallet: any) => {
            addresses.push({
              blockchain: wallet.blockchain,
              symbol: wallet.currency,
              address: wallet.address,
              logo: getCurrencyLogo(wallet.currency),
              wallet_type: wallet.wallet_type
            });
          });
          
          setWalletAddresses(addresses);
          setDisplayedWallets(addresses);
          if (addresses.length > 0) {
            setSelectedChain(addresses[0]);
          }
          setNoWalletsFound(addresses.length === 0);
          
          const existingSymbols = new Set(addresses.map(a => a.symbol));
          const missing = MAIN_CURRENCIES.filter(c => !existingSymbols.has(c));
          
          if (missing.length > 0) {
            console.log(`Missing currencies detected: ${missing.join(', ')}`);
            setMissingCurrencies(missing);
          } else {
            setMissingCurrencies([]);
          }
          
        } else if (data && data.shouldCreateWallets) {
          console.log("No wallets found for user, but mnemonic exists. Creating wallets.");
          await createWallets();
        } else {
          console.log("No wallets found for user, attempting to create wallets");
          await createWallets();
        }
      } catch (error: any) {
        console.error("Error fetching wallet addresses:", error);
        setFetchError(error.message || "Failed to load wallet addresses");
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

  const createWallets = async () => {
    if (!user || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Creating wallets for user:", user.id);
      
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      console.log("Wallet creation response:", data);
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      
      await refreshWallets();
      
      toast({
        title: "Wallets created",
        description: "Your wallets have been created successfully.",
      });
      
    } catch (error: any) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const refreshWallets = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId: user?.id }
      });
      
      if (error) throw error;
      
      console.log("Refresh wallet data:", data);
      
      if (data?.success && data.wallets && data.wallets.length > 0) {
        const addresses: WalletAddress[] = data.wallets.map((wallet: any) => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency),
          wallet_type: wallet.wallet_type
        }));
        
        setWalletAddresses(addresses);
        setDisplayedWallets(addresses);
        if (addresses.length > 0) {
          setSelectedChain(addresses[0]);
        }
        setNoWalletsFound(addresses.length === 0);
        
        const existingSymbols = new Set(addresses.map(a => a.symbol));
        const missing = MAIN_CURRENCIES.filter(c => !existingSymbols.has(c));
        
        if (missing.length > 0) {
          console.log(`Missing currencies after refresh: ${missing.join(', ')}`);
          setMissingCurrencies(missing);
          
          if (data?.shouldCreateWallets) {
            console.log("Backend suggests we should create missing wallets");
            await createWallets();
          }
        } else {
          setMissingCurrencies([]);
        }
        
        toast({
          title: "Wallets refreshed",
          description: `Found ${addresses.length} wallets`,
        });
      } else if (data?.shouldCreateWallets) {
        console.log("Backend suggests we should create missing wallets");
        await createWallets();
      } else {
        setNoWalletsFound(true);
      }
    } catch (error: any) {
      console.error("Error refreshing wallets:", error);
      setFetchError(error.message || "Failed to refresh wallets");
      toast({
        title: "Error",
        description: "Failed to refresh wallets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
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
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-gray-600">Creating your wallets...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (fetchError) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex flex-col items-center justify-center h-64">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error loading wallets</AlertTitle>
            <AlertDescription>
              {fetchError}
            </AlertDescription>
          </Alert>
          <KashButton onClick={refreshWallets} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Try Again
          </KashButton>
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

  if (walletAddresses.length === 0 && debugInfo) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 w-full mb-4">
            <h3 className="font-medium text-amber-700 mb-2">No Wallets Found</h3>
            <p className="text-amber-700 text-sm mb-4">
              We received data from the server but couldn't find any wallets.
            </p>
            <div className="flex space-x-2">
              <KashButton 
                onClick={createWallets} 
                disabled={creatingWallets}
              >
                Create My Wallets
              </KashButton>
              <KashButton 
                variant="outline"
                onClick={refreshWallets}
                disabled={loading}
              >
                Refresh
              </KashButton>
            </div>
          </div>
          
          <div className="mt-4 p-4 border border-gray-200 rounded-lg w-full">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <div className="text-xs text-left overflow-auto max-h-48 bg-gray-50 p-2 rounded">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
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
          <p className="text-gray-600">
            Select a wallet to view and share your address
          </p>
          
          {missingCurrencies.length > 0 && (
            <div className="mt-2 text-amber-600 bg-amber-50 p-2 rounded-md text-sm">
              <p className="flex items-center justify-center">
                <Info size={14} className="mr-1" /> 
                Missing currencies: {missingCurrencies.join(', ')}
              </p>
              <KashButton 
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={createWallets}
                disabled={creatingWallets}
              >
                {creatingWallets ? 
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Creating...</> : 
                  <><RefreshCw size={14} className="mr-2" /> Recreate Wallets</>
                }
              </KashButton>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <KashButton 
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={refreshWallets}
            disabled={loading}
          >
            {loading ? 
              <Loader2 size={18} className="animate-spin" /> : 
              <RefreshCw size={18} />
            }
          </KashButton>
        </div>

        {Object.keys(groupedWallets).length === 0 ? (
          <div className="flex justify-center">
            <KashButton onClick={refreshWallets}>
              Refresh Wallets
            </KashButton>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedWallets).map(([symbol, wallets]) => (
              <div key={symbol} className="mb-3">
                <div className="flex items-center mb-2 px-1">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={getCurrencyLogo(symbol)} alt={symbol} />
                    <AvatarFallback>{symbol[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{symbol}</h3>
                  {prices && prices[symbol] && (
                    <span className="ml-2 text-xs text-gray-500">
                      ${prices[symbol].price.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {wallets.map((wallet, idx) => (
                    <KashCard 
                      key={`${wallet.blockchain}-${idx}`}
                      className={`p-4 transition-all duration-200 hover:shadow-md ${
                        selectedChain?.address === wallet.address ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100'
                      }`}
                      onClick={() => setSelectedChain(wallet)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getNetworkLogo(wallet.blockchain)} alt={wallet.blockchain} />
                            <AvatarFallback>{wallet.blockchain[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <NetworkBadge network={wallet.blockchain} />
                            <p className="text-xs text-gray-500 mt-1">
                              {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                            </p>
                          </div>
                        </div>
                        <KashButton 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(wallet.address);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Copy size={14} />
                        </KashButton>
                      </div>
                    </KashCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedChain && (
          <KashCard className="p-5 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Avatar className="h-10 w-10 mr-2">
                  <AvatarImage src={getNetworkLogo(selectedChain.blockchain)} alt={selectedChain.blockchain} />
                  <AvatarFallback>{selectedChain.blockchain[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-medium text-lg">
                  {selectedChain.symbol} on {selectedChain.blockchain}
                </h3>
              </div>
              
              {showQR ? (
                <div className="mb-4 flex justify-center">
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <QRCodeSVG 
                      value={selectedChain.address}
                      size={180}
                      level="H"
                      includeMargin={true}
                      className="w-full h-full"
                    />
                    <p className="text-xs text-gray-500 mt-2 break-all px-2">
                      {selectedChain.address}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 break-all text-sm font-mono border border-gray-100">
                  {selectedChain.address}
                </div>
              )}
              
              <div className="flex space-x-2">
                <KashButton 
                  variant="outline"
                  fullWidth
                  icon={<Copy size={18} />}
                  onClick={() => copyToClipboard(selectedChain.address)}
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
            </div>
          </KashCard>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Important</h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
            {selectedChain && (
              <>
                <li>Only send {selectedChain.symbol} on the {selectedChain.blockchain} network to this address</li>
                <li>Sending any other cryptocurrency or using the wrong network may result in permanent loss</li>
                <li>Always verify the entire address before sending any funds</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receive;
