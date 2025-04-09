
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import MPesaUsdtSection from '@/components/swap/MPesaUsdtSection';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useState } from 'react';

const SellUsdt = () => {
  const { toast } = useToast();
  const { prices } = useCryptoPrices();
  const [balance, setBalance] = useState(1000); // Example initial balance
  
  const usdtAsset = {
    symbol: 'USDT',
    name: 'Tether',
    logo: '/usdt-logo.png',
    price: prices?.USDT?.price || 1.00,
  };
  
  const handleTransactionComplete = (amount: number, type: 'buy' | 'sell') => {
    if (type === 'sell') {
      setBalance(prevBalance => prevBalance - amount);
      toast({
        title: "USDT Sold",
        description: `You have successfully sold ${amount} USDT for M-PESA.`,
      });
    } else {
      setBalance(prevBalance => prevBalance + amount);
      toast({
        title: "USDT Purchased",
        description: `You have successfully bought ${amount} USDT with M-PESA.`,
      });
    }
  };
  
  return (
    <MainLayout title="M-PESA ↔ USDT" showBack>
      <div className="max-w-md mx-auto">
        <MPesaUsdtSection 
          asset={usdtAsset}
          balance={balance}
          onTransactionComplete={handleTransactionComplete}
        />
      </div>
    </MainLayout>
  );
};

export default SellUsdt;
