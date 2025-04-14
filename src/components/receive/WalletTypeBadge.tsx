
import React from 'react';

interface WalletTypeBadgeProps {
  type: string;
  className?: string;
}

export const WalletTypeBadge: React.FC<WalletTypeBadgeProps> = ({ type, className }) => {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium ${className}`}>
      {type}
    </span>
  );
};
