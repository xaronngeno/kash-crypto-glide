
import { useState } from 'react';
import { Copy, QrCode } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';

// Mock wallet addresses
const walletAddresses = [
  { 
    blockchain: 'Ethereum', 
    symbol: 'ETH', 
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  },
  { 
    blockchain: 'Bitcoin', 
    symbol: 'BTC', 
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  },
  { 
    blockchain: 'Solana', 
    symbol: 'SOL', 
    address: '7FLULmeKL5EQWeoxGkvhbnAoHQk28nFYdq8EpxmGEiLS'
  },
  { 
    blockchain: 'Tron', 
    symbol: 'TRX', 
    address: 'THuc7WJR7YUzwEyYYcJCpMXmTMjyf8KTBL'
  }
];

const Receive = () => {
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState(walletAddresses[0]);
  const [showQR, setShowQR] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

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
              key={chain.blockchain}
              variant={selectedChain.blockchain === chain.blockchain ? "primary" : "outline"}
              className="py-3"
              onClick={() => setSelectedChain(chain)}
            >
              {chain.symbol}
            </KashButton>
          ))}
        </div>

        {/* Selected blockchain wallet address */}
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

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Important</h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
            <li>Only send {selectedChain.symbol} to this address</li>
            <li>Sending any other cryptocurrency may result in permanent loss</li>
            <li>Verify the entire address before sending any funds</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receive;
