
import { useState, useEffect } from 'react';

// Simple hook to track wallet creation status
export const useWalletCreationStatus = () => {
  const [walletsCreated, setWalletsCreated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check local storage to see if wallets have been created previously
    const storedStatus = localStorage.getItem('walletsCreated');
    if (storedStatus === 'true') {
      setWalletsCreated(true);
    }
  }, []);
  
  const markWalletsAsCreated = () => {
    localStorage.setItem('walletsCreated', 'true');
    setWalletsCreated(true);
  };
  
  return { walletsCreated, markWalletsAsCreated };
};
