
/**
 * Validates cryptocurrency addresses for different blockchain networks
 */

// Bitcoin address validation
export const isBitcoinAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  // BIP44 legacy address format (starts with 1)
  const legacyBitcoinRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/;
  
  return legacyBitcoinRegex.test(address);
};

// Ethereum address validation (0x followed by 40 hex chars)
export const isEthereumAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumRegex.test(address);
};

// Solana address validation (base58 encoded, 32-44 chars)
export const isSolanaAddress = (address: string): boolean => {
  // Enhanced validation for Solana addresses
  if (!address || typeof address !== 'string') return false;
  
  try {
    // Solana addresses are base58 encoded public keys, typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    // Check basic format
    if (!base58Regex.test(address)) return false;
    
    return true;
  } catch (error) {
    console.error("Error validating Solana address:", error);
    return false;
  }
};

// Check if address matches the selected network
export const validateAddressForNetwork = (address: string, network: string): boolean => {
  if (!address || !network) return false;
  
  switch (network.toLowerCase()) {
    case 'bitcoin':
      return isBitcoinAddress(address);
    case 'ethereum':
      return isEthereumAddress(address);
    case 'solana':
      return isSolanaAddress(address);
    default:
      return false;
  }
};

// Get network name from address format
export const detectNetworkFromAddress = (address: string): string | null => {
  if (!address) return null;
  
  if (isBitcoinAddress(address)) return 'Bitcoin';
  if (isEthereumAddress(address)) return 'Ethereum';
  if (isSolanaAddress(address)) return 'Solana';
  
  return null;
};
