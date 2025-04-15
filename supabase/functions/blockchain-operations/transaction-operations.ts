
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { NETWORK_ENDPOINTS, NETWORK_ENV, APPLICATION_WALLETS, calculateCommission } from './utils.ts';

// Process an Ethereum transaction
export async function processEthereumTransaction(
  privateKey: string, 
  recipient: string, 
  amount: number
): Promise<{ txHash: string, commissionAmount: number, finalAmount: number }> {
  const provider = new ethers.JsonRpcProvider(NETWORK_ENDPOINTS.ETHEREUM[NETWORK_ENV]);
  const wallet = new ethers.Wallet(privateKey, provider);
  const appWalletAddress = APPLICATION_WALLETS.ETHEREUM;
  
  // Calculate commission
  const { commissionAmount, finalAmount } = calculateCommission(amount, 'Ethereum');
  
  // Send to application wallet first (commission)
  console.log(`Sending ${commissionAmount} ETH commission to ${appWalletAddress}`);
  const commissionTx = await wallet.sendTransaction({
    to: appWalletAddress,
    value: ethers.parseEther(commissionAmount.toString())
  });
  await commissionTx.wait();
  console.log(`Commission transaction confirmed: ${commissionTx.hash}`);
  
  // Send remaining amount to the final recipient
  console.log(`Sending ${finalAmount} ETH to recipient ${recipient}`);
  const recipientTx = await wallet.sendTransaction({
    to: recipient,
    value: ethers.parseEther(finalAmount.toString())
  });
  await recipientTx.wait();
  console.log(`Recipient transaction confirmed: ${recipientTx.hash}`);
  
  return {
    txHash: recipientTx.hash,
    commissionAmount,
    finalAmount
  };
}

// Placeholder for Solana transaction processing
export async function processSolanaTransaction(
  privateKey: string, 
  recipient: string, 
  amount: number, 
  address: string
): Promise<{ txHash: string, commissionAmount: number, finalAmount: number }> {
  // Calculate commission
  const { commissionAmount, finalAmount } = calculateCommission(amount, 'Solana');
  
  // This is just a placeholder - a real implementation would use the Solana Web3.js library
  // to create and send transactions
  console.log(`Would send ${commissionAmount} SOL to commission wallet and ${finalAmount} SOL to ${recipient}`);
  
  // For now, return a placeholder transaction hash
  return {
    txHash: "solana-transaction-hash-placeholder",
    commissionAmount,
    finalAmount
  };
}
