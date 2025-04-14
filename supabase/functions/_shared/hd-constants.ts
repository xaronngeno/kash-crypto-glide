
// BIP44 path constants
export const BIP44_PURPOSE = "44";
export const BIP44_ETHEREUM_COIN_TYPE = "60";
export const BIP44_SOLANA_COIN_TYPE = "501";

// Standard derivation paths for different blockchains
export const DERIVATION_PATHS = {
  ETHEREUM: `m/${BIP44_PURPOSE}'/${BIP44_ETHEREUM_COIN_TYPE}'/0'/0/0`,
  SOLANA: `m/${BIP44_PURPOSE}'/${BIP44_SOLANA_COIN_TYPE}'/0'/0'`
};
