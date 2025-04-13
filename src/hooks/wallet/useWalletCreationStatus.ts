
import { useState } from 'react';

/**
 * Hook for tracking if wallets have been created
 * @deprecated Import from useWalletManager instead
 */
export const useWalletCreationStatus = () => {
  const [walletsCreated, setWalletsCreated] = useState(false);
  
  return {
    walletsCreated,
    setWalletsCreated,
    markWalletsAsCreated: () => setWalletsCreated(true)
  };
};
