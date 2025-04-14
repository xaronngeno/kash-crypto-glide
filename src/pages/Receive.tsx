
import { useState, useEffect, useCallback } from 'react';
import { Search, Info, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Token } from '@/types/token';
import { WalletAddress } from '@/types/wallet';
import { getNetworkLogo } from '@/utils/currencyUtils';
import { useWalletManagement } from '@/hooks/receive/useWalletManagement';
import { useTokenProcessing } from '@/hooks/receive/useTokenProcessing';
import { LoadingView } from '@/components/receive/LoadingView';
import { NoWalletsView } from '@/components/receive/NoWalletsView';
import { TokenList } from '@/components/receive/TokenList';
import { NetworkList } from '@/components/receive/NetworkList';
import { NetworkBadge } from '@/components/receive/NetworkBadge';
import { AddressView } from '@/components/receive/AddressView';
import { refreshWalletBalances } from '@/hooks/wallet';

enum ReceiveStep {
  SELECT_COIN = 'select_coin',
  SELECT_NETWORK = 'select_network',
  VIEW_ADDRESS = 'view_address'
}

const Receive = () => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  
  const { 
    walletAddresses, 
    loading, 
    creatingWallets, 
    noWalletsFound, 
    createWallets, 
    handleTryAgain,
    refreshWalletBalancesOnly
  } = useWalletManagement({ 
    userId: user?.id,
    skipInitialLoad: true // Skip loading on first render, use cached data
  });
  
  const { availableTokens } = useTokenProcessing(walletAddresses);
  
  const [currentStep, setCurrentStep] = useState<ReceiveStep>(ReceiveStep.SELECT_COIN);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    if (availableTokens.length > 0 && !selectedToken) {
      setSelectedToken(availableTokens[0]);
    }
    
    if (!initialLoadComplete && walletAddresses.length > 0) {
      setInitialLoadComplete(true);
    }
  }, [availableTokens, selectedToken, walletAddresses, initialLoadComplete]);

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
    }
  };

  const resetFlow = () => {
    setCurrentStep(ReceiveStep.SELECT_COIN);
    setSelectedNetwork(null);
    setSelectedWallet(null);
  };
  
  const handleRefreshBalance = async () => {
    if (user?.id) {
      await refreshWalletBalancesOnly(user.id);
    }
  };

  if (loading && !initialLoadComplete) {
    return (
      <MainLayout title="Receive" showBack>
        <LoadingView />
      </MainLayout>
    );
  }

  if (creatingWallets) {
    return (
      <MainLayout title="Receive" showBack>
        <LoadingView message="Creating your wallets..." />
      </MainLayout>
    );
  }

  if (noWalletsFound) {
    return (
      <MainLayout title="Receive" showBack>
        <NoWalletsView 
          onCreateWallets={createWallets} 
          creatingWallets={creatingWallets} 
        />
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
              
              <TokenList
                tokens={availableTokens}
                onTokenSelect={handleTokenSelect}
                searchTerm={searchTerm}
                prices={prices}
              />
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
            
            <NetworkList
              token={selectedToken}
              onNetworkSelect={handleNetworkSelect}
              getNetworkLogo={getNetworkLogo}
            />
            
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

            <AddressView 
              selectedWallet={selectedWallet}
              onReset={resetFlow}
              onTryAgain={handleTryAgain}
              refreshBalance={handleRefreshBalance}
            />
          </KashCard>
        )}
      </div>
    </MainLayout>
  );
};

export default Receive;
