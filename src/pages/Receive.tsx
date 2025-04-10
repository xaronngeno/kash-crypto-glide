
import { useState, useEffect } from 'react';
import { Copy, QrCode, Info, Bitcoin, Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';

interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
}

// Demo wallet addresses for users who don't have real wallets yet
const demoWallets: WalletAddress[] = [
  {
    blockchain: 'Bitcoin',
    symbol: 'BTC',
    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
  },
  {
    blockchain: 'Ethereum',
    symbol: 'ETH',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
  },
  {
    blockchain: 'Ethereum',
    symbol: 'USDT',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
  },
  {
    blockchain: 'Solana',
    symbol: 'SOL',
    address: 'EXuiKFwQUd9VKCMsR3VnQpD1RAYmrQRLpxW8pnZWCtan'
  },
  {
    blockchain: 'Tron',
    symbol: 'TRX',
    address: 'TH2Quo8DVXpKzBGBeCoRmsmfw7P6jfrzVN'
  }
];

// Required wallet types that must always be available
const requiredWalletTypes = ['BTC', 'ETH', 'USDT', 'SOL', 'TRX'];

const Receive = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedChain, setSelectedChain] = useState<WalletAddress | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [usingDemoWallets, setUsingDemoWallets] = useState(false);

  useEffect(() => {
    const fetchWalletAddresses = async () => {
      if (!user) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('wallets')
          .select('blockchain, currency, address')
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Use a Set to track unique combinations of blockchain+symbol
          const uniqueWalletKeys = new Set();
          const addresses: WalletAddress[] = [];
          
          data.forEach(wallet => {
            const walletKey = `${wallet.blockchain}-${wallet.currency}`;
            
            // Only add if this combination doesn't already exist
            if (!uniqueWalletKeys.has(walletKey)) {
              uniqueWalletKeys.add(walletKey);
              addresses.push({
                blockchain: wallet.blockchain,
                symbol: wallet.currency,
                address: wallet.address
              });
            }
          });
          
          console.log("Fetched wallet addresses:", addresses);
          
          // Check if we have all required wallet types
          const fetchedSymbols = new Set(addresses.map(addr => addr.symbol));
          let missingWalletTypes = false;
          
          for (const requiredType of requiredWalletTypes) {
            if (!fetchedSymbols.has(requiredType)) {
              missingWalletTypes = true;
              // Add missing wallet types from demo data
              const demoWallet = demoWallets.find(w => w.symbol === requiredType);
              if (demoWallet) {
                addresses.push({...demoWallet});
                console.log(`Added missing ${requiredType} wallet from demo data`);
              }
            }
          }
          
          if (missingWalletTypes) {
            toast({
              title: "Some demo wallets added",
              description: "We've added demo wallets for missing blockchain types.",
              variant: "default"
            });
          }
          
          setWalletAddresses(addresses);
          setSelectedChain(addresses[0]);
          setUsingDemoWallets(missingWalletTypes);
        } else {
          console.log("No wallets found for user, using demo wallets");
          setWalletAddresses(demoWallets);
          setSelectedChain(demoWallets[0]);
          setUsingDemoWallets(true);
          toast({
            title: "Demo Mode",
            description: "Showing sample wallet addresses for demonstration.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("Error fetching wallet addresses:", error);
        toast({
          title: "Demo Mode",
          description: "Showing sample wallet addresses for demonstration.",
          variant: "default"
        });
        setWalletAddresses(demoWallets);
        setSelectedChain(demoWallets[0]);
        setUsingDemoWallets(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddresses();
  }, [user, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

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

  return (
    <MainLayout title="Receive" showBack>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Receive Crypto</h2>
          <p className="text-gray-600">
            Select a blockchain and share your wallet address
          </p>
          {usingDemoWallets && (
            <p className="text-xs text-amber-600 mt-1">
              {usingDemoWallets === true ? "Showing sample demo addresses" : "Some demo addresses included"}
            </p>
          )}
        </div>
        
        {/* Wallet summary section */}
        <KashCard className="p-4 mb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Wallets</h3>
            <KashButton 
              variant="ghost" 
              className="text-sm flex items-center gap-1"
              onClick={() => setShowAllDetails(!showAllDetails)}
            >
              <Info size={16} />
              {showAllDetails ? "Hide Details" : "Show All Details"}
            </KashButton>
          </div>
          
          <p className="text-sm text-gray-500 mt-1 mb-3">
            {walletAddresses.length} wallets {usingDemoWallets ? "(some demo)" : "created at registration"}
          </p>
          
          {showAllDetails && (
            <div className="space-y-4 mt-4 border-t pt-4">
              {walletAddresses.map((wallet, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{wallet.symbol}</h4>
                      <p className="text-xs text-gray-500">{wallet.blockchain}</p>
                    </div>
                    <KashButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address)}
                      className="h-8 px-2"
                    >
                      <Copy size={14} />
                    </KashButton>
                  </div>
                  <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {wallet.address}
                  </p>
                </div>
              ))}
            </div>
          )}
        </KashCard>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* Use a unique key for each wallet button to prevent duplicates */}
          {walletAddresses.map((chain, index) => (
            <KashButton
              key={`${chain.blockchain}-${chain.symbol}-${index}`}
              variant={selectedChain?.blockchain === chain.blockchain && selectedChain?.symbol === chain.symbol ? "primary" : "outline"}
              className="py-3 flex items-center justify-center gap-1"
              onClick={() => setSelectedChain(chain)}
            >
              {chain.symbol === 'BTC' && <Bitcoin size={14} className="mr-1" />}
              {chain.symbol === 'SOL' && <Wallet size={14} className="mr-1" />}
              {chain.symbol}
            </KashButton>
          ))}
        </div>

        {selectedChain && (
          <KashCard className="p-5">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-3">{selectedChain.blockchain} Address</h3>
              
              {showQR ? (
                <div className="mb-4 flex justify-center">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <QRCodeSVG 
                      value={selectedChain.address}
                      size={200}
                      level="H"
                      includeMargin={true}
                      className="w-40 h-40"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-kash-lightGray p-4 rounded-lg mb-4 break-all text-sm font-mono">
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
            <li>Only send {selectedChain?.symbol} to this address</li>
            <li>Sending any other cryptocurrency may result in permanent loss</li>
            <li>Verify the entire address before sending any funds</li>
            {usingDemoWallets && (
              <li className="font-bold">These are demo addresses - do not send real funds!</li>
            )}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receive;
