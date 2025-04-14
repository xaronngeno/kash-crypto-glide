
/**
 * Validates cryptocurrency addresses for different blockchain networks
 */

// Bitcoin address validation - supports both legacy and SegWit formats
export const isBitcoinAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  // BIP44 legacy address format (starts with 1)
  const legacyBitcoinRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/;
  
  // Native SegWit address format (starts with bc1)
  const segWitBitcoinRegex = /^bc1[a-zA-Z0-9]{25,90}$/;
  
  // Check if address matches either format
  const isValid = legacyBitcoinRegex.test(address) || segWitBitcoinRegex.test(address);
  console.log(`Bitcoin address validation for ${address}: ${isValid}`);
  return isValid;
};

// Ethereum address validation (0x followed by 40 hex chars)
export const isEthereumAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  const isValid = ethereumRegex.test(address);
  console.log(`Ethereum address validation for ${address}: ${isValid}`);
  return isValid;
};

// Solana address validation (base58 encoded, 32-44 chars)
export const isSolanaAddress = (address: string): boolean => {
  // Enhanced validation for Solana addresses
  if (!address || typeof address !== 'string') return false;
  
  try {
    // Solana addresses are base58 encoded public keys, typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    // Check basic format
    const isValid = base58Regex.test(address);
    console.log(`Solana address validation for ${address}: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error("Error validating Solana address:", error);
    return false;
  }
};

// Check if address matches the selected network
export const validateAddressForNetwork = (address: string, network: string): boolean => {
  if (!address || !network) return false;
  
  const result = (() => {
    switch (network.toLowerCase()) {
      case 'bitcoin':
        return isBitcoinAddress(address);
      case 'ethereum':
        return isEthereumAddress(address);
      case 'solana':
        return isSolanaAddress(address);
      default:
        console.log(`Unknown network type: ${network}`);
        return false;
    }
  })();
  
  console.log(`Address validation for ${network}: ${result}`);
  return result;
};

// Get network name from address format
export const detectNetworkFromAddress = (address: string): string | null => {
  if (!address) return null;
  
  if (isBitcoinAddress(address)) return 'Bitcoin';
  if (isEthereumAddress(address)) return 'Ethereum';
  if (isSolanaAddress(address)) return 'Solana';
  
  console.log(`Could not detect network for address: ${address}`);
  return null;
};
