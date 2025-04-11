
/**
 * Utility functions related to blockchain networks
 */

export const getNetworkLogo = (blockchain: string): string => {
  switch (blockchain.toLowerCase()) {
    case 'bitcoin':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
    case 'ethereum':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'solana':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'tron':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'binance smart chain':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'polygon':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
  }
};
