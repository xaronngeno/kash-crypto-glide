
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { ArrowUpRight, ArrowDownRight, Repeat, CreditCard } from 'lucide-react';

// Mock transaction data
const transactions = [
  { 
    id: 1, 
    type: 'send', 
    asset: 'BTC', 
    amount: 0.005, 
    date: '2023-04-01T14:32:00Z',
    status: 'Completed',
    address: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5'
  },
  { 
    id: 2, 
    type: 'receive', 
    asset: 'ETH', 
    amount: 0.25, 
    date: '2023-04-01T09:15:00Z',
    status: 'Completed',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  },
  { 
    id: 3, 
    type: 'swap', 
    asset: 'USDT', 
    targetAsset: 'SOL',
    amount: 250, 
    receivedAmount: 15.24,
    date: '2023-03-28T16:45:00Z',
    status: 'Completed'
  },
  { 
    id: 4, 
    type: 'buy', 
    asset: 'USDT', 
    amount: 500, 
    date: '2023-03-25T11:20:00Z',
    status: 'Completed',
    paymentMethod: 'M-PESA'
  },
  { 
    id: 5, 
    type: 'send', 
    asset: 'SOL', 
    amount: 2.5, 
    date: '2023-03-22T08:10:00Z',
    status: 'Failed',
    address: '7FLULmeKL5EQWeoxGkvhbnAoHQk28nFYdq8EpxmGEiLS'
  },
  { 
    id: 6, 
    type: 'receive', 
    asset: 'BTC', 
    amount: 0.015, 
    date: '2023-03-18T19:30:00Z',
    status: 'Completed',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const History = () => {
  return (
    <MainLayout title="Activity">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
      
        <div className="space-y-3">
          {transactions.map((tx) => (
            <KashCard key={tx.id} className="hover:bg-kash-lightGray cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {tx.type === 'send' && <ArrowUpRight size={20} className="text-kash-error" />}
                  {tx.type === 'receive' && <ArrowDownRight size={20} className="text-kash-green" />}
                  {tx.type === 'swap' && <Repeat size={20} className="text-blue-500" />}
                  {tx.type === 'buy' && <CreditCard size={20} className="text-purple-500" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium capitalize">{tx.type}</h3>
                    <span className={`font-medium ${tx.type === 'send' ? 'text-kash-error' : 'text-kash-green'}`}>
                      {tx.type === 'send' ? '-' : 
                       tx.type === 'receive' ? '+' : 
                       tx.type === 'swap' ? '' : '+'}
                      {tx.amount} {tx.asset}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 mt-0.5">
                    <span>{formatDate(tx.date)}</span>
                    <span className={`${tx.status === 'Failed' ? 'text-kash-error' : ''}`}>
                      {tx.status}
                    </span>
                  </div>
                  
                  {tx.type === 'swap' && (
                    <div className="text-sm text-gray-600 mt-1">
                      Swapped to {tx.receivedAmount} {tx.targetAsset}
                    </div>
                  )}
                  
                  {tx.type === 'buy' && (
                    <div className="text-sm text-gray-600 mt-1">
                      Paid with {tx.paymentMethod}
                    </div>
                  )}
                </div>
              </div>
            </KashCard>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default History;
