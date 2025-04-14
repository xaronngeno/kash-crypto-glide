
import React from 'react';

interface NetworkBadgeProps {
  network: string;
  className?: string;
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({ network, className }) => {
  let color = "bg-gray-100 text-gray-500";
  
  switch (network.toLowerCase()) {
    case 'ethereum':
      color = "bg-indigo-100 text-indigo-600";
      break;
    case 'solana':
      color = "bg-purple-100 text-purple-600";
      break;
    default:
      color = "bg-gray-100 text-gray-500";
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color} font-medium ${className}`}>
      {network}
    </span>
  );
};
