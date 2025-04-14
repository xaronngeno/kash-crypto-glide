
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { validateAddressForNetwork } from '@/utils/addressValidator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const TransactionConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Get transaction details from location state
  const transactionData = location.state || {};
  
  // Calculate commission (if applicable)
  const showCommission = transactionData.type === 'send' && transactionData.includeCommission;
  const commissionPercentage = showCommission ? 1 : 0; // 1% commission
  const commissionAmount = showCommission ? transactionData.amount * (commissionPercentage / 100) : 0;
  const finalAmount = transactionData.amount - commissionAmount;
  
  // Validate the address one more time
  const addressValid = transactionData.type === 'send' ? 
    validateAddressForNetwork(transactionData.recipient, transactionData.network) : true;
  
  const handleConfirm = () => {
    setLoading(true);
    
    // Simulate transaction processing
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Transaction successful",
        description: `Your ${transactionData.type} has been processed successfully.`,
      });
      navigate('/dashboard');
    }, 1500);
  };
  
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <MainLayout title="Confirm Transaction" showBack hideBottomNav>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Review Transaction</h2>
          <p className="text-gray-600">
            Please verify the transaction details
          </p>
        </div>
        
        {!addressValid && transactionData.type === 'send' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Mismatch Warning</AlertTitle>
            <AlertDescription>
              The recipient address format doesn't match the {transactionData.network} network. 
              Proceeding may result in permanent loss of funds.
            </AlertDescription>
          </Alert>
        )}
        
        <KashCard>
          <div className="space-y-4">
            <h3 className="font-semibold text-center capitalize">{transactionData.type} Transaction</h3>
            
            <div className="space-y-3 pt-2">
              {/* Render different details based on transaction type */}
              {transactionData.type === 'send' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">From</span>
                    <span className="font-medium">Your {transactionData.asset?.symbol} Wallet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To</span>
                    <span className="font-medium text-right break-all text-sm">
                      {transactionData.recipient?.substring(0, 15)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">{transactionData.amount} {transactionData.asset?.symbol}</span>
                  </div>
                  
                  {showCommission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">App Fee ({commissionPercentage}%)</span>
                      <span className="font-medium">{commissionAmount.toFixed(6)} {transactionData.asset?.symbol}</span>
                    </div>
                  )}
                  
                  {showCommission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient Gets</span>
                      <span className="font-medium">{finalAmount.toFixed(6)} {transactionData.asset?.symbol}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="font-medium">{transactionData.fee} {transactionData.asset?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-medium">{transactionData.network}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold">
                      {(transactionData.amount + transactionData.fee).toFixed(6)} {transactionData.asset?.symbol}
                    </span>
                  </div>
                </>
              )}
              
              {transactionData.type === 'buy' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">M-PESA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Number</span>
                    <span className="font-medium">{transactionData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount (KES)</span>
                    <span className="font-medium">{transactionData.amountKES?.toLocaleString()} KES</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">You will receive</span>
                    <span className="font-semibold">{transactionData.amountUSDT} {transactionData.asset}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </KashCard>
        
        {showCommission && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Transaction Fee Information</p>
                <p>This transaction includes a {commissionPercentage}% commission fee. The recipient will receive {finalAmount.toFixed(6)} {transactionData.asset?.symbol}.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 pt-4">
          <KashButton
            fullWidth
            onClick={handleConfirm}
            disabled={loading}
            variant={!addressValid && transactionData.type === 'send' ? "destructive" : "default"}
          >
            {loading ? 'Processing...' : !addressValid && transactionData.type === 'send' ? 
              'Proceed Anyway (Not Recommended)' : 'Confirm Transaction'}
          </KashButton>
          
          <KashButton
            fullWidth
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </KashButton>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Important</h4>
          <p className="text-sm text-amber-700">
            By confirming this transaction, you agree that it cannot be reversed once processed.
            {!addressValid && transactionData.type === 'send' && (
              <strong className="block mt-1">
                WARNING: The address format doesn't match the selected network. This transaction is likely to fail or result in lost funds.
              </strong>
            )}
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TransactionConfirmation;
