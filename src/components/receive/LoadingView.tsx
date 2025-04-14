
import React from 'react';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message = "Loading your wallets..." }) => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse text-center">
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};
