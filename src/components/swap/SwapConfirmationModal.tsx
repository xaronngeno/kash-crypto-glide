
import React from 'react';
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

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: {
    symbol: string;
  };
  toToken: {
    symbol: string;
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Swap</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the swap details before confirming.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 flex flex-col gap-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">From</span>
            <span className="font-medium">{amount} {fromToken.symbol}</span>
          </div>

          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">To</span>
            <span className="font-medium">{estimatedReceived.toFixed(6)} {toToken.symbol}</span>
          </div>

          <div className="flex justify-between p-3">
            <span className="text-gray-600">Exchange Rate</span>
            <span>1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}</span>
          </div>

          <div className="flex justify-between p-3">
            <span className="text-gray-600">Network Fee</span>
            <span>{fee} {fromToken.symbol}</span>
          </div>

          <div className="mt-2 p-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="font-medium">{(amount + fee).toFixed(6)} {fromToken.symbol}</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-kash-green hover:bg-kash-green/90 text-white"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            Confirm Swap
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SwapConfirmationModal;
