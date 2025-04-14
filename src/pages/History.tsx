
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { ArrowUpRight, ArrowDownRight, Repeat, CreditCard, Loader2, Clock, XCircle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
        toast({
          title: "Error",
          description: "Couldn't load your transaction history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, toast]);

  return (
    <MainLayout title="Recent Activity">
      <div className="space-y-4 pb-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <Button variant="outline" size="sm" className="text-gray-500">
            <Filter size={16} className="mr-1" />
            Filter
          </Button>
        </div>
      
        <TransactionList 
          transactions={transactions} 
          loading={loading} 
          error={error} 
        />
      </div>
    </MainLayout>
  );
};

export default TransactionHistory;
