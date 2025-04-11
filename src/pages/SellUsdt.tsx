
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import MPesaUsdtSection from '@/components/swap/MPesaUsdtSection';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const SellUsdt = () => {
  const [balance, setBalance] = useState(1000); // Example initial balance
  const [usdtPrice, setUsdtPrice] = useState(1.00);
  const { user } = useAuth();
  
  // Fetch the USDT price directly
  useEffect(() => {
    const fetchUsdtPrice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('crypto-prices', {
          method: 'GET'
        });
        
        if (error) throw error;
        
        if (data && data.prices && data.prices.USDT) {
          setUsdtPrice(data.prices.USDT.price || 1.00);
        }
      } catch (err) {
        console.error('Failed to fetch USDT price:', err);
      }
    };
    
    fetchUsdtPrice();
  }, []);
  
  const usdtAsset = {
    symbol: 'USDT',
    name: 'Tether',
    logo: '/usdt-logo.png',
    price: usdtPrice,
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
