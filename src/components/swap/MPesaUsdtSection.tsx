
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import SellUsdtTab from './SellUsdtTab';
import BuyUsdtTab from './BuyUsdtTab';
import MpesaHowItWorks from './MpesaHowItWorks';
import { AssetInfo } from './types';

interface MPesaUsdtSectionProps {
  asset?: AssetInfo;
  balance: number;
  onTransactionComplete: (amount: number, type: 'buy' | 'sell') => void;
}

const MPesaUsdtSection = ({ asset, balance, onTransactionComplete }: MPesaUsdtSectionProps) => {
  const { profile } = useAuth();
  
  // Common states
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [error, setError] = useState<string | null>(null);
  
  // Fixed rates for KES/USDT conversion
  const rateInfo = {
    usdtToKesRate: 145, // Example rate: 1 USDT = 145 KES
    kesExchangeRate: 0.0069, // 1 KES = 0.0069 USDT
    maxUsdtLimit: 1000,
    minKesAmount: 500,
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="sell" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="sell">Sell USDT</TabsTrigger>
          <TabsTrigger value="buy">Buy USDT</TabsTrigger>
        </TabsList>
        
        {/* SELL TAB */}
        <TabsContent value="sell">
          <SellUsdtTab 
            asset={asset}
            balance={balance}
            onTransactionComplete={onTransactionComplete}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            rateInfo={rateInfo}
          />
        </TabsContent>
        
        {/* BUY TAB */}
        <TabsContent value="buy">
          <BuyUsdtTab 
            asset={asset}
            onTransactionComplete={onTransactionComplete}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            rateInfo={rateInfo}
          />
        </TabsContent>
      </Tabs>
      
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <h4 className="font-medium text-amber-700 mb-1">Important</h4>
        <p className="text-sm text-amber-700">
          M-PESA transactions are processed instantly. Please ensure the phone number is correct before proceeding.
          Maximum transaction limit: {rateInfo.maxUsdtLimit} USDT.
        </p>
      </div>
      
      <MpesaHowItWorks />
    </div>
  );
};

export default MPesaUsdtSection;
