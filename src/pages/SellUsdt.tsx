
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import MPesaUsdtSection from '@/components/swap/MPesaUsdtSection';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const SellUsdt = () => {
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { prices } = useCryptoPrices();
  const { user } = useAuth();
  
  // Fetch USDT balance for the user
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUsdtBalance = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
          method: 'POST',
          body: { userId: user.id }
        });
        
        if (error) {
          setError(`Failed to fetch wallet balance: ${error.message}`);
          throw error;
        }
        
        if (data?.wallets) {
          // Find USDT wallet(s) and sum balances
          const usdtBalance = data.wallets
            .filter(wallet => wallet.currency === 'USDT')
            .reduce((sum, wallet) => sum + (parseFloat(wallet.balance) || 0), 0);
          
          setBalance(usdtBalance);
        }
      } catch (err) {
        console.error('Failed to fetch USDT balance:', err);
        setError('Failed to fetch your USDT balance. Please try again later.');
      }
    };
    
    fetchUsdtBalance();
  }, [user?.id]);
  
  // Get USDT price from prices data
  const usdtPrice = prices?.USDT?.price || 1.00;
  
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
