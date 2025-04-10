
import { useState, useEffect } from 'react';
import { Copy, QrCode } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

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

  // Fetch actual wallet addresses from the database
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

        // Map database results to the WalletAddress format
        if (data && data.length > 0) {
          const addresses = data.map(wallet => ({
            blockchain: wallet.blockchain,
            symbol: wallet.currency,
            address: wallet.address
          }));
          
          console.log("Fetched wallet addresses:", addresses);
          setWalletAddresses(addresses);
          setSelectedChain(addresses[0]); // Select first wallet by default
        } else {
          console.log("No wallets found for user");
          toast({
            title: "No wallets found",
            description: "You don't have any wallets yet.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching wallet addresses:", error);
        toast({
          title: "Error fetching wallets",
          description: "Could not load your wallet addresses.",
          variant: "destructive"
        });
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

  if (walletAddresses.length === 0) {
    return (
      <MainLayout title="Receive" showBack>
        <div className="text-center h-64 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium mb-3">No Wallets Found</h3>
          <p className="text-gray-600 mb-6">
            You don't have any wallets configured yet.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Receive" showBack>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-1">Receive Crypto</h2>
          <p className="text-gray-600">
            Select a blockchain and share your wallet address
          </p>
        </div>

        {/* Blockchain selector */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {walletAddresses.map(chain => (
            <KashButton
              key={`${chain.blockchain}-${chain.symbol}`}
              variant={selectedChain?.blockchain === chain.blockchain && selectedChain?.symbol === chain.symbol ? "primary" : "outline"}
              className="py-3"
              onClick={() => setSelectedChain(chain)}
            >
              {chain.symbol}
            </KashButton>
          ))}
        </div>

        {/* Selected blockchain wallet address */}
        {selectedChain && (
          <KashCard className="p-5">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-3">{selectedChain.blockchain} Address</h3>
              
              {showQR ? (
                <div className="mb-4 flex justify-center">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <QrCode size={120} className="text-gray-800" />
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
