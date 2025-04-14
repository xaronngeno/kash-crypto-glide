
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { NetworkBadge } from './NetworkBadge';

interface AddressQRCodeProps {
  address: string;
  blockchain: string;
}

export const AddressQRCode: React.FC<AddressQRCodeProps> = ({ address, blockchain }) => {
  return (
    <div className="mb-4 flex justify-center">
      <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
        <QRCodeSVG 
          value={address}
          size={180}
          level="H"
          includeMargin={true}
          className="w-full h-full"
        />
        <div className="mt-2 text-xs text-center">
          <NetworkBadge network={blockchain} />
          <p className="text-gray-500 mt-1 break-all px-2">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
};
