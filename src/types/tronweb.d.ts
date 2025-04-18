
declare module '@tronweb3/tronweb' {
  export class TronWeb {
    constructor(options: {
      fullHost: string;
      headers?: Record<string, string>;
    });
    
    trx: {
      getBalance(address: string): Promise<number>;
      getAccount(address: string): Promise<any>;
      sendTransaction(from: string, to: string, amount: number): Promise<any>;
    };
    
    address: {
      toHex(address: string): string;
      fromHex(hexAddress: string): string;
      fromPrivateKey(privateKey: string): string;
    };
    
    createAccount(): Promise<{
      address: { base58: string; hex: string };
      privateKey: string;
    }>;
  }

  export default TronWeb;
}
