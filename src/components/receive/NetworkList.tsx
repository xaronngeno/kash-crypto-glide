
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NetworkBadge } from './NetworkBadge';
import { Token } from '@/types/token';

interface NetworkListProps {
  token: Token;
  onNetworkSelect: (network: string) => void;
  getNetworkLogo: (network: string) => string;
}

export const NetworkList: React.FC<NetworkListProps> = ({ 
  token, 
  onNetworkSelect,
  getNetworkLogo
}) => {
  return (
    <div className="space-y-2">
      {token.networks?.map((network) => (
        <div
          key={network}
          className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onNetworkSelect(network)}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getNetworkLogo(network)} alt={network} />
              <AvatarFallback>{network[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
              <h3 className="font-medium">{network}</h3>
              <NetworkBadge network={network} className="ml-2" />
            </div>
          </div>
          <ArrowRight size={18} className="text-gray-400" />
        </div>
      ))}
    </div>
  );
};
