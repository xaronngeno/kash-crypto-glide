
import React from 'react';

const MpesaHowItWorks = () => {
  return (
    <div className="space-y-4 mt-2">
      <h3 className="font-medium">How it works</h3>
      <div className="space-y-3">
        <div className="flex">
          <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
            1
          </div>
          <p className="text-sm text-gray-600">Enter the amount and your M-PESA phone number</p>
        </div>
        <div className="flex">
          <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
            2
          </div>
          <p className="text-sm text-gray-600">{`For buying: You'll receive an M-PESA prompt on your phone`}</p>
        </div>
        <div className="flex">
          <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
            3
          </div>
          <p className="text-sm text-gray-600">Complete the transaction and receive your USDT immediately</p>
        </div>
      </div>
    </div>
  );
};

export default MpesaHowItWorks;
