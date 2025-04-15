
import React from 'react';

interface SwapRateInfoProps {
  fromToken: {
    symbol: string;
  };
  toToken: {
    symbol: string;
  };
  rate: number;
  fee: number;
  spillage?: number;
}

const SwapRateInfo = ({ fromToken, toToken, rate, fee, spillage = 0.5 }: SwapRateInfoProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Swap Rate</span>
          <span className="text-sm">
            1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Network Fee</span>
          <span className="text-sm">
            {fee} {fromToken.symbol}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Max Spillage</span>
          <span className="text-sm text-green-600">
            {spillage}%
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Price Impact</span>
          <span className="text-sm text-green-600">
            &lt; 0.01%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwapRateInfo;
