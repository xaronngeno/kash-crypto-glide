
import React from 'react';
import { NetworkBadge } from './NetworkBadge';

interface AddressDisplayProps {
  address: string;
  blockchain: string;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, blockchain }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4 relative">
      <div className="absolute top-0 right-0 mt-2 mr-2 flex">
        <NetworkBadge network={blockchain} />
      </div>
      <p className="break-all text-sm font-mono border-gray-100 pt-4">
        {address}
      </p>
    </div>
  );
};
