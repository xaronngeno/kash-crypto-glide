
import React, { useState, useEffect } from 'react';
import { Copy, QrCode, Info, RefreshCw } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { WalletAddress } from '@/types/wallet';
import { NetworkBadge } from './NetworkBadge';
import { AddressQRCode } from './AddressQRCode';
import { AddressDisplay } from './AddressDisplay';
import { forceRefreshBlockchainBalance } from '@/utils/blockchainConnectors';

interface AddressViewProps {
  selectedWallet: WalletAddress;
  onReset: () => void;
  onTryAgain: () => void;
  refreshBalance?: () => Promise<void>;
}

export const AddressView: React.FC<AddressViewProps> = ({ 
  selectedWallet, 
  onReset,
  onTryAgain,
  refreshBalance
}) => {
  const [showQR, setShowQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localBalance, setLocalBalance] = useState<number | undefined>(selectedWallet.balance);
  const { toast } = useToast();
  
  // Debug logging for the selected wallet
  useEffect(() => {
    console.log('AddressView - Selected wallet:', {
      blockchain: selectedWallet.blockchain,
      symbol: selectedWallet.symbol,
      address: selectedWallet.address,
      addressLength: selectedWallet.address ? selectedWallet.address.length : 0,
      isEmpty: !selectedWallet.address || selectedWallet.address.trim() === '',
      balance: selectedWallet.balance
    });
    
    setLocalBalance(selectedWallet.balance);
  }, [selectedWallet]);

  const copyToClipboard = (text: string) => {
    if (!text || text.trim() === '') {
      toast({
        title: "Error",
        description: "No valid address to copy",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  // Add direct blockchain balance check
  const checkBlockchainBalance = async () => {
    if (!selectedWallet.address || selectedWallet.address.trim() === '') {
      toast({
        title: "Cannot check balance",
        description: "No valid address available",
        variant: "destructive"
      });
      return;
    }
    
    setRefreshing(true);
    toast({
      title: "Checking blockchain",
      description: `Fetching ${selectedWallet.symbol} balance directly from blockchain...`
    });
    
    try {
      const balance = await forceRefreshBlockchainBalance(
        selectedWallet.address,
        selectedWallet.blockchain as 'Ethereum' | 'Solana'
      );
      
      // Log detailed balance info
      console.log(`Direct blockchain balance check:`, {
        blockchain: selectedWallet.blockchain,
        address: selectedWallet.address,
        fetchedBalance: balance,
        currentBalance: selectedWallet.balance,
        hasChanged: balance !== selectedWallet.balance
      });
      
      setLocalBalance(balance);
      
      if (balance > 0) {
        toast({
          title: "Balance found!",
          description: `Found ${balance} ${selectedWallet.symbol} on blockchain!`,
        });
      } else {
        toast({
          title: "Balance checked",
          description: `No ${selectedWallet.symbol} found on this address yet.`,
        });
      }
    } catch (error) {
      console.error("Error checking blockchain balance:", error);
      toast({
        title: "Check failed",
        description: "Could not check blockchain balance directly",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (refreshBalance && !refreshing) {
      setRefreshing(true);
      try {
        // First check blockchain directly
        await checkBlockchainBalance();
        
        // Then use the provided refresh function to update UI
        await refreshBalance();
        
        toast({
          title: "Balance refreshed",
          description: "Your wallet balance has been updated",
        });
      } catch (error) {
        console.error("Error refreshing balance:", error);
        toast({
          title: "Refresh failed",
          description: "Could not update balance at this time",
          variant: "destructive"
        });
      } finally {
        setRefreshing(false);
      }
    } else {
      // If no refresh function provided, just check blockchain
      await checkBlockchainBalance();
    }
  };

  // Format balance with proper decimal display
  const formatBalance = (amount: number | undefined, symbol: string) => {
    if (amount === undefined || amount === 0) return `0.000000000000 ${symbol}`;
    
    // Very small amounts (show all decimals to prevent displaying 0)
    if (amount > 0 && amount < 0.000001) {
      return `${amount.toFixed(12).replace(/\.?0+$/, '')} ${symbol}`;
    }
    
    // Standard amounts
    return `${amount.toFixed(12).replace(/\.?0+$/, '')} ${symbol}`;
  };

  // Check if the address is valid
  const hasValidAddress = selectedWallet.address && selectedWallet.address.trim() !== "";

  return (
    <div>
      <div className="text-center">
        <div className="inline-block mb-3">
          <NetworkBadge network={selectedWallet.blockchain} />
        </div>
        
        {localBalance !== undefined && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-lg font-medium">
              {formatBalance(localBalance, selectedWallet.symbol)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        )}
        
        {!hasValidAddress ? (
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
        
        {hasValidAddress && (
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
      
      <div className="mt-4 space-y-2">
        <KashButton 
          variant="outline"
          fullWidth
          disabled={refreshing}
          onClick={handleRefreshBalance}
          icon={<RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />}
        >
          {refreshing ? "Checking Balance..." : "Check Blockchain Balance"}
        </KashButton>
        
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
