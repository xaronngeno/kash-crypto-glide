import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { ArrowUpRight, ArrowDownRight, Repeat, CreditCard, Loader2, History as HistoryIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'card' | 'table'>('card');
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
      <MainLayout title="Transaction History">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Transaction History">
        <div className="text-center p-4 text-kash-error">
          <p>{error}</p>
          <p className="mt-2 text-sm">Please try again later</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Transaction History">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HistoryIcon size={24} className="text-gray-600" />
            <h2 className="text-xl font-semibold">All Transactions</h2>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setViewType('card')}
              className={`px-3 py-1 rounded-md text-sm ${viewType === 'card' ? 'bg-kash-green text-white' : 'bg-gray-100'}`}
            >
              Card
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`px-3 py-1 rounded-md text-sm ${viewType === 'table' ? 'bg-kash-green text-white' : 'bg-gray-100'}`}
            >
              Table
            </button>
          </div>
        </div>
      
        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-md">
            <p className="text-gray-500">No transaction history yet</p>
          </div>
        ) : (
          <>
            {viewType === 'card' ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <KashCard key={tx.id} className="hover:bg-kash-lightGray cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {tx.transaction_type === 'send' && <ArrowUpRight size={20} className="text-kash-error" />}
                        {tx.transaction_type === 'receive' && <ArrowDownRight size={20} className="text-kash-green" />}
                        {tx.transaction_type === 'swap' && <Repeat size={20} className="text-blue-500" />}
                        {tx.transaction_type === 'buy' && <CreditCard size={20} className="text-purple-500" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium capitalize">{tx.transaction_type}</h3>
                          <span className={`font-medium ${tx.transaction_type === 'send' ? 'text-kash-error' : 'text-kash-green'}`}>
                            {tx.transaction_type === 'send' ? '-' : 
                             tx.transaction_type === 'receive' ? '+' : 
                             tx.transaction_type === 'swap' ? '' : '+'}
                            {tx.amount} {tx.currency}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-500 mt-0.5">
                          <span>{formatDate(tx.created_at)}</span>
                          <span className={`${tx.status === 'Failed' ? 'text-kash-error' : ''}`}>
                            {tx.status}
                          </span>
                        </div>
                        
                        {tx.transaction_type === 'swap' && tx.target_currency && tx.swap_amount && (
                          <div className="text-sm text-gray-600 mt-1">
                            Swapped to {tx.swap_amount} {tx.target_currency}
                          </div>
                        )}
                        
                        {tx.transaction_type === 'buy' && tx.payment_method && (
                          <div className="text-sm text-gray-600 mt-1">
                            Paid with {tx.payment_method}
                          </div>
                        )}
                      </div>
                    </div>
                  </KashCard>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium capitalize">{tx.transaction_type}</TableCell>
                        <TableCell>{formatDate(tx.created_at)}</TableCell>
                        <TableCell className={tx.transaction_type === 'send' ? 'text-kash-error' : 'text-kash-green'}>
                          {tx.transaction_type === 'send' ? '-' : 
                           tx.transaction_type === 'receive' ? '+' : 
                           tx.transaction_type === 'swap' ? '' : '+'}
                          {tx.amount} {tx.currency}
                        </TableCell>
                        <TableCell className={tx.status === 'Failed' ? 'text-kash-error' : ''}>
                          {tx.status}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {tx.transaction_type === 'swap' && tx.target_currency && tx.swap_amount ? 
                            `Swapped to ${tx.swap_amount} ${tx.target_currency}` : ''}
                          {tx.transaction_type === 'buy' && tx.payment_method ? 
                            `Paid with ${tx.payment_method}` : ''}
                          {tx.transaction_type === 'send' && tx.to_address ? 
                            `To: ${tx.to_address.substring(0, 10)}...` : ''}
                          {tx.transaction_type === 'receive' && tx.from_address ? 
                            `From: ${tx.from_address.substring(0, 10)}...` : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default TransactionHistory;
