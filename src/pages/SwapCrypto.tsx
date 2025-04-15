
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import SwapForm from '@/components/swap/SwapForm';
import { SwapTransaction } from '@/components/swap/types';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  decimals: number;
  icon: string;
  platform?: {
    name: string;
    logo: string;
  };
  change_24h?: number;
}

const SwapCrypto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { prices, loading: pricesLoading } = useCryptoPrices();

  const [assets, setAssets] = useState<CryptoAsset[]>([
    { id: 'usdt', symbol: 'USDT', name: 'Tether', logo: '/usdt-logo.png', price: 1.00, decimals: 6, icon: '/usdt-logo.png' },
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', logo: '/btc-logo.png', price: 60000, decimals: 8, icon: '/btc-logo.png' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', logo: '/eth-logo.png', price: 3000, decimals: 18, icon: '/eth-logo.png' },
    { id: 'sol', symbol: 'SOL', name: 'Solana', logo: '/sol-logo.png', price: 150, decimals: 9, icon: '/sol-logo.png' },
  ]);

  const [balances, setBalances] = useState({
    USDT: 1000,
    BTC: 0.01,
    ETH: 0.1,
    SOL: 1,
  });
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      const updatedAssets = [...assets];
      
      Object.entries(prices).forEach(([symbol, data]) => {
        const existingAssetIndex = updatedAssets.findIndex(asset => asset.symbol === symbol);
        
        if (existingAssetIndex >= 0) {
          updatedAssets[existingAssetIndex] = {
            ...updatedAssets[existingAssetIndex],
            price: data.price,
            logo: data.logo || updatedAssets[existingAssetIndex].logo,
            icon: data.logo || updatedAssets[existingAssetIndex].icon,
            change_24h: data.change_24h,
          };
        } else {
          updatedAssets.push({
            id: symbol.toLowerCase(),
            symbol: symbol,
            name: data.name || symbol,
            logo: data.logo || '',
            icon: data.logo || symbol.charAt(0),
            price: data.price,
            decimals: 18,
            platform: data.platform,
            change_24h: data.change_24h,
          });
        }
      });
      
      setAssets(updatedAssets);
    }
  }, [prices]);

  const handleSwapComplete = (newTransaction: SwapTransaction) => {
    // Update balances
    const newBalances = { ...balances };
    newBalances[newTransaction.fromAsset] = Number(newBalances[newTransaction.fromAsset]) - newTransaction.fromAmount;
    newBalances[newTransaction.toAsset] = Number(newBalances[newTransaction.toAsset]) + newTransaction.toAmount;
    setBalances(newBalances);
    
    // Add transaction to history
    setTransactions([newTransaction, ...transactions]);
    
    toast({
      title: 'Swap Successful',
      description: `You have successfully swapped ${newTransaction.fromAmount} ${newTransaction.fromAsset} for ${newTransaction.toAmount.toFixed(6)} ${newTransaction.toAsset}.`,
    });
  };

  if (pricesLoading) {
    return (
      <MainLayout title="Swap" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <p className="text-gray-500">Loading current prices...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Swap" showBack>
      <div className="max-w-md mx-auto">
        <SwapForm 
          assets={assets} 
          balances={balances} 
          onSwapComplete={handleSwapComplete} 
        />
      </div>
    </MainLayout>
  );
};

export default SwapCrypto;
