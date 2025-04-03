
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';

const TransactionConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Get transaction details from location state
  const transactionData = location.state || {};
  
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="font-medium">{transactionData.fee} {transactionData.asset?.symbol}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold">{(transactionData.amount + transactionData.fee).toFixed(6)} {transactionData.asset?.symbol}</span>
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
        
        <div className="space-y-3 pt-4">
          <KashButton
            fullWidth
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Transaction'}
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
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TransactionConfirmation;
