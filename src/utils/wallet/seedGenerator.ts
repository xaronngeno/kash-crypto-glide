
import { ethers } from 'ethers';

/**
 * Generate a new random seed phrase
 */
export const generateSeedPhrase = (): string => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic?.phrase || "";
  } catch (error) {
    console.error("Error generating seed phrase:", error);
    throw new Error("Failed to generate seed phrase");
  }
};

/**
 * Validate if a string is a valid BIP-39 mnemonic
 */
export const validateMnemonic = (seedPhrase: string): boolean => {
  return ethers.Mnemonic.isValidMnemonic(seedPhrase);
};
