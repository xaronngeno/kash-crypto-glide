
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { KashButton } from '@/components/ui/KashButton';
import { SwapTransaction } from './types';

interface TransactionSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SwapTransaction | null;
}

const TransactionSuccess = ({ isOpen, onClose, transaction }: TransactionSuccessProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        onClose();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!transaction) return null;

  const handleViewTransaction = () => {
    navigate('/history', { state: { transaction } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden">
        <div className="relative flex flex-col items-center justify-center p-6 text-center">
          {/* Background success gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-white opacity-70 z-0" />
          
          {/* Success animation */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6 
            }}
            className="relative z-10 mb-4"
          >
            <div className="rounded-full bg-green-100 p-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" strokeWidth={1.5} />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative z-10"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Swap Successful!</h2>
            <p className="text-gray-600 mb-4">
              You've swapped {transaction.fromAmount} {transaction.fromAsset} for {transaction.toAmount} {transaction.toAsset}
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium text-gray-800">{transaction.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-800">
                  {new Date(transaction.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <KashButton
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Close
              </KashButton>
              
              <KashButton
                fullWidth
                icon={<ExternalLink size={18} />}
                onClick={handleViewTransaction}
              >
                View Transaction
              </KashButton>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionSuccess;
