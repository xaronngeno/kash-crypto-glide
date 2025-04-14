
import React, { useState } from 'react';
import { Copy, QrCode, Info } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { WalletAddress } from '@/types/wallet';
import { NetworkBadge } from './NetworkBadge';
import { AddressQRCode } from './AddressQRCode';
import { AddressDisplay } from './AddressDisplay';

interface AddressViewProps {
  selectedWallet: WalletAddress;
  onReset: () => void;
  onTryAgain: () => void;
}

export const AddressView: React.FC<AddressViewProps> = ({ 
  selectedWallet, 
  onReset,
  onTryAgain 
}) => {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <div>
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
              onClick={onTryAgain}
              variant="outline"
              size="sm"
            >
              Try Again
            </KashButton>
          </div>
        ) : showQR ? (
          <AddressQRCode 
            address={selectedWallet.address} 
            blockchain={selectedWallet.blockchain} 
          />
        ) : (
          <AddressDisplay 
            address={selectedWallet.address} 
            blockchain={selectedWallet.blockchain} 
          />
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
          onClick={onReset}
        >
          Receive Different Coin
        </KashButton>
      </div>
    </div>
  );
};
