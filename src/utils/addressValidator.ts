
/**
 * Validates cryptocurrency addresses for different blockchain networks
 */

// Bitcoin address validation (starts with 1, 3, bc1, or special format for our local dev)
export const isBitcoinAddress = (address: string): boolean => {
  // Standard Bitcoin address formats - only SegWit (bc1...)
  const segwitBitcoinRegex = /^(bc1)[a-zA-Z0-9]{25,62}$/;
  
  return segwitBitcoinRegex.test(address);
};

// Ethereum address validation (0x followed by 40 hex chars)
export const isEthereumAddress = (address: string): boolean => {
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
    
    // In a real-world scenario, we could perform additional validation:
    // 1. Try decoding the base58 string and check if it's 32 bytes
    // 2. Verify with Solana web3.js if it's a valid public key
    
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
