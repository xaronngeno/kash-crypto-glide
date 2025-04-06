
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SellUsdtSection from '@/components/swap/SellUsdtSection';
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
  
  const handleSellComplete = (amount: number) => {
    setBalance(prevBalance => prevBalance - amount);
    toast({
      title: "USDT Sold",
      description: `You have successfully sold ${amount} USDT for M-PESA.`,
    });
  };
  
  return (
    <MainLayout title="Sell USDT" showBack>
      <div className="max-w-md mx-auto">
        <SellUsdtSection 
          asset={usdtAsset}
          balance={balance}
          onSellComplete={handleSellComplete}
        />
      </div>
    </MainLayout>
  );
};

export default SellUsdt;
