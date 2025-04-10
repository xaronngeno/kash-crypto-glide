
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import MPesaUsdtSection from '@/components/swap/MPesaUsdtSection';
import { useToast } from '@/hooks/use-toast';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

const SellUsdt = () => {
  const { toast } = useToast();
  const { prices } = useCryptoPrices();
  
  // Use USDT data from prices if available
  const usdtAsset = {
    symbol: 'USDT',
    name: 'Tether',
    logo: '/usdt-logo.png',
    price: prices?.USDT?.price || 1.00,
  };
  
  const handleTransactionComplete = (amount: number, type: 'buy' | 'sell') => {
    if (type === 'sell') {
      toast({
        title: "USDT Sold",
        description: `You have successfully sold ${amount} USDT for M-PESA.`,
      });
    } else {
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
          balance={0} // Start with zero balance for simplicity
          onTransactionComplete={handleTransactionComplete}
        />
      </div>
    </MainLayout>
  );
};

export default SellUsdt;
