
import React from 'react';
import { KashButton } from '@/components/ui/KashButton';

interface NoWalletsViewProps {
  onCreateWallets: () => void;
  creatingWallets: boolean;
}

export const NoWalletsView: React.FC<NoWalletsViewProps> = ({ onCreateWallets, creatingWallets }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 w-full">
        <h3 className="font-medium text-amber-700 mb-2">No Wallets Found</h3>
        <p className="text-amber-700 text-sm mb-4">
          Your account doesn't have any wallets set up yet.
        </p>
        <KashButton 
          onClick={onCreateWallets} 
          disabled={creatingWallets}
        >
          Create My Wallets
        </KashButton>
      </div>
    </div>
  );
};
