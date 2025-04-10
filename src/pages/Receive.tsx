
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

const Receive = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedChain, setSelectedChain] = useState<WalletAddress | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [noWalletsFound, setNoWalletsFound] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);

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
          
          setWalletAddresses(addresses);
          setSelectedChain(addresses[0]);
          setNoWalletsFound(false);
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
      
      // Fetch the newly created wallets
      const { data: wallets, error: fetchError } = await supabase
        .from('wallets')
        .select('blockchain, currency, address')
        .eq('user_id', user.id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (wallets && wallets.length > 0) {
        const uniqueWalletKeys = new Set();
        const addresses: WalletAddress[] = [];
        
        wallets.forEach(wallet => {
          const walletKey = `${wallet.blockchain}-${wallet.currency}`;
          
          if (!uniqueWalletKeys.has(walletKey)) {
            uniqueWalletKeys.add(walletKey);
            addresses.push({
              blockchain: wallet.blockchain,
              symbol: wallet.currency,
              address: wallet.address
            });
          }
        });
        
        setWalletAddresses(addresses);
        setSelectedChain(addresses[0]);
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
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Receive Crypto</h2>
          <p className="text-gray-600">
            Select a blockchain and share your wallet address
          </p>
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
            {walletAddresses.length} wallets available
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
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receive;
