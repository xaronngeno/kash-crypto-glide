
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Initialize ECPair factory for Bitcoin
const ECPair = ECPairFactory(ecc);

// Bitcoin network selection (mainnet for now, could be testnet)
const bitcoinNetwork = bitcoin.networks.bitcoin;

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Taproot" or "Native Segwit"
}

// Generate a Solana wallet
export const generateSolanaWallet = (): WalletData => {
  try {
    const keypair = Keypair.generate();
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error('Failed to generate Solana wallet');
  }
};

// Generate an Ethereum wallet or Ethereum-compatible wallet
export const generateEthWallet = (blockchain: string, platform: string): WalletData => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      blockchain,
      platform,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};

// Generate a Sui wallet
export const generateSuiWallet = (): WalletData => {
  try {
    const keypair = new Ed25519Keypair();
    return {
      blockchain: 'Sui',
      platform: 'Sui',
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keypair.export().privateKey, 'base64').toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate Sui wallet');
  }
};

// Generate Bitcoin wallets
export const generateBitcoinWallet = (type: 'taproot' | 'segwit'): WalletData => {
  try {
    const keyPair = ECPair.makeRandom();
    const { address } = type === 'taproot' 
      ? bitcoin.payments.p2tr({ 
          internalPubkey: keyPair.publicKey.slice(1, 33),
          network: bitcoinNetwork 
        })
      : bitcoin.payments.p2wpkh({ 
          pubkey: keyPair.publicKey, 
          network: bitcoinNetwork 
        });

    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address: address!,
      privateKey: keyPair.privateKey?.toString('hex'),
      walletType: type === 'taproot' ? 'Taproot' : 'Native SegWit'
    };
  } catch (error) {
    console.error(`Error generating Bitcoin ${type} wallet:`, error);
    throw new Error(`Failed to generate Bitcoin ${type} wallet`);
  }
};

// Generate all wallets for a user
export const generateAllWallets = (): WalletData[] => {
  try {
    return [
      generateSolanaWallet(),
      generateEthWallet('Ethereum', 'Ethereum'),
      generateEthWallet('Monad', 'Monad Testnet'),
      generateEthWallet('Base', 'Base'),
      generateSuiWallet(),
      generateEthWallet('Polygon', 'Polygon'),
      generateBitcoinWallet('taproot'),
      generateBitcoinWallet('segwit')
    ];
  } catch (error) {
    console.error('Error generating wallets:', error);
    throw new Error('Failed to generate one or more wallets');
  }
};
