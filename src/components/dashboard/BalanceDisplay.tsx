
import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { useAuth } from '@/components/AuthProvider';
import { refreshWalletBalances } from '@/hooks/wallet';

interface BalanceDisplayProps {
  totalBalance: number;
  currency: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export const BalanceDisplay = ({ 
  totalBalance, 
  currency, 
  refreshing, 
  onRefresh 
}: BalanceDisplayProps) => {
  const [hideBalance, setHideBalance] = useState(false);
  const { user } = useAuth();

  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    
    try {
      console.log("Starting wallet refresh");
      await refreshWalletBalances(user.id);
      console.log("Wallet balances refreshed, reloading data");
      onRefresh();
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-4">
      <div className="text-gray-500 text-sm mb-1 flex items-center">
        <span>Total Balance</span>
        <KashButton 
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          className="ml-2 h-6 w-6"
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </KashButton>
      </div>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold">
          {currency === 'USD' ? '$' : 'KES '}
          {hideBalance ? '•••••' : totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </h1>
        <button 
          onClick={() => setHideBalance(!hideBalance)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};
