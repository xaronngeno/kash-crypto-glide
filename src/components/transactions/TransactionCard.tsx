
import { KashCard } from '@/components/ui/KashCard';
import { ArrowUpRight, ArrowDownRight, Repeat, CreditCard, Clock, XCircle } from 'lucide-react';
import { formatAddress } from '@/utils/addressFormatter';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  target_currency?: string;
  swap_amount?: number;
  status: string;
  to_address?: string;
  from_address?: string;
  payment_method?: string;
  created_at: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

export const TransactionCard = ({ transaction: tx }: TransactionCardProps) => {
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.status === 'Failed') {
      return <XCircle size={32} className="text-kash-error" />;
    }
    
    switch (transaction.transaction_type) {
      case 'send':
        return (
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
            <ArrowUpRight size={20} className="text-white" />
          </div>
        );
      case 'receive':
        return (
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
            <ArrowDownRight size={20} className="text-white" />
          </div>
        );
      case 'swap':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Repeat size={20} className="text-white" />
          </div>
        );
      case 'buy':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
            <CreditCard size={20} className="text-white" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
            <Clock size={20} className="text-white" />
          </div>
        );
    }
  };

  return (
    <KashCard className="hover:bg-kash-lightGray cursor-pointer">
      <div className="flex items-center">
        {getTransactionIcon(tx)}
        
        <div className="flex-1 ml-4">
          <div className="flex justify-between">
            <h3 className="font-medium capitalize">
              {tx.status === 'Failed' ? 'Failed app interaction' : tx.transaction_type}
            </h3>
            <span className={`font-medium ${tx.transaction_type === 'send' ? 'text-kash-error' : 'text-kash-green'}`}>
              {tx.transaction_type === 'send' ? '-' : 
              tx.transaction_type === 'receive' ? '+' : ''}
              {tx.status !== 'Failed' && `${tx.amount} ${tx.currency}`}
            </span>
          </div>
          
          <div className="text-sm text-gray-500 mt-0.5">
            {tx.status === 'Failed' ? 'Unknown' : (
              tx.transaction_type === 'send' && tx.to_address ? 
                `To ${formatAddress(tx.to_address)}` : 
              tx.transaction_type === 'receive' && tx.from_address ? 
                `From ${formatAddress(tx.from_address)}` : ''
            )}
          </div>
        </div>
      </div>
    </KashCard>
  );
}
