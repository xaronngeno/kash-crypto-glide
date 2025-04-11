
/**
 * Validates cryptocurrency addresses for different blockchain networks
 */

// Bitcoin address validation (starts with 1, 3, or bc1)
export const isBitcoinAddress = (address: string): boolean => {
  const bitcoinRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;
  return bitcoinRegex.test(address);
};

// Ethereum address validation (0x followed by 40 hex chars)
export const isEthereumAddress = (address: string): boolean => {
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumRegex.test(address);
};

// Tron address validation (T followed by base58 chars)
export const isTronAddress = (address: string): boolean => {
  const tronRegex = /^T[a-zA-Z0-9]{33}$/;
  return tronRegex.test(address);
};

// Solana address validation (base58 encoded, 32-44 chars)
export const isSolanaAddress = (address: string): boolean => {
  // Enhanced validation for Solana addresses
  if (!address || typeof address !== 'string') return false;
  
  // Solana addresses are base58 encoded and should be between 32-44 chars
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
};

// Binance Smart Chain validation (same format as Ethereum)
export const isBscAddress = (address: string): boolean => {
  return isEthereumAddress(address); // BSC uses the same address format as Ethereum
};

// Polygon address validation (same format as Ethereum)
export const isPolygonAddress = (address: string): boolean => {
  return isEthereumAddress(address); // Polygon uses the same address format as Ethereum
};

// Check if address matches the selected network
export const validateAddressForNetwork = (address: string, network: string): boolean => {
  if (!address || !network) return false;
  
  switch (network.toLowerCase()) {
    case 'bitcoin':
      return isBitcoinAddress(address);
    case 'ethereum':
      return isEthereumAddress(address);
    case 'tron':
      return isTronAddress(address);
    case 'solana':
      return isSolanaAddress(address);
    case 'binance smart chain':
      return isBscAddress(address);
    case 'polygon':
      return isPolygonAddress(address);
    default:
      return false;
  }
};

// Get network name from address format
export const detectNetworkFromAddress = (address: string): string | null => {
  if (!address) return null;
  
  if (isBitcoinAddress(address)) return 'Bitcoin';
  if (isEthereumAddress(address)) return 'Ethereum/BSC/Polygon'; // These share the same format
  if (isTronAddress(address)) return 'Tron';
  if (isSolanaAddress(address)) return 'Solana';
  
  return null;
};
