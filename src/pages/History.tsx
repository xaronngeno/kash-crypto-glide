
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { ArrowUpRight, ArrowDownRight, Repeat, CreditCard, Loader2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const groupTransactionsByDate = (transactions: Transaction[]) => {
  const grouped = transactions.reduce((acc, transaction) => {
    const date = formatDate(transaction.created_at);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);
  
  return grouped;
};

const formatAddress = (address: string | undefined) => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <MainLayout title="Recent Activity">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Recent Activity">
        <div className="text-center p-4 text-kash-error">
          <p>{error}</p>
          <p className="mt-2 text-sm">Please try again later</p>
        </div>
      </MainLayout>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

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
    <MainLayout title="Recent Activity">
      <div className="space-y-4 pb-20">
        <div className="mb-6">
          {/* Heading "Recent Activity" removed */}
        </div>
      
        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-md">
            <p className="text-gray-500">No transaction history yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-lg text-gray-500 font-medium">{date}</h3>
                {dateTransactions.map((tx) => (
                  <KashCard key={tx.id} className="hover:bg-kash-lightGray cursor-pointer">
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
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TransactionHistory;
