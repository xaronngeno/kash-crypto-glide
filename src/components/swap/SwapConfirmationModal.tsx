
import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowRightLeft } from 'lucide-react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: {
    symbol: string;
    logo?: string;
  };
  toToken: {
    symbol: string;
    logo?: string;
  };
  amount: number;
  estimatedReceived: number;
  fee: number;
  rate: number;
}

const SwapConfirmationModal: React.FC<SwapConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  amount,
  estimatedReceived,
  fee,
  rate,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-0 overflow-hidden bg-white">
        <AlertDialogHeader className="bg-gray-50 p-6 pb-4">
          <AlertDialogTitle className="text-xl font-bold text-center">Confirm Swap</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-500">
            Please review your swap details
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                {fromToken.logo ? (
                  <img src={fromToken.logo} alt={fromToken.symbol} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-lg font-bold">{fromToken.symbol.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium">{fromToken.symbol}</span>
              <span className="text-lg font-bold">{amount}</span>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
            >
              <div className="bg-kash-green bg-opacity-10 p-2 rounded-full">
                <ArrowRightLeft className="text-kash-green" />
              </div>
            </motion.div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                {toToken.logo ? (
                  <img src={toToken.logo} alt={toToken.symbol} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-lg font-bold">{toToken.symbol.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium">{toToken.symbol}</span>
              <span className="text-lg font-bold">{estimatedReceived.toFixed(6)}</span>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-medium">1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee</span>
              <span className="font-medium">{fee} {fromToken.symbol}</span>
            </div>

            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold">{(amount + fee).toFixed(6)} {fromToken.symbol}</span>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-6">
            <p className="text-amber-700 text-sm">
              The final amount may change due to market fluctuations. Your swap will be executed at the best available rate.
            </p>
          </div>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto bg-kash-green hover:bg-kash-green/90 text-white"
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
            >
              Confirm Swap
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SwapConfirmationModal;
