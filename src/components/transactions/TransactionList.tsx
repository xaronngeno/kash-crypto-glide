
import { groupTransactionsByDate, formatDate } from '@/utils/dateUtils';
import { NoTransactions } from './NoTransactions';
import { TransactionCard } from './TransactionCard';
import { Loader2 } from 'lucide-react';

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

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const TransactionList = ({ transactions, loading, error }: TransactionListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-kash-error">
        <p>{error}</p>
        <p className="mt-2 text-sm">Please try again later</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <NoTransactions />;
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-lg text-gray-500 font-medium">{date}</h3>
          {dateTransactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      ))}
    </div>
  );
};
