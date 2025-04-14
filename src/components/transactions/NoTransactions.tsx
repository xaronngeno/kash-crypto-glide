
import { Table } from '@/components/ui/table';

export const NoTransactions = () => {
  return (
    <div className="w-full py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <div className="max-w-md">
        <h3 className="font-medium text-lg mb-2">No transaction history yet</h3>
        <p className="text-gray-500 mb-6">
          When you make transactions, they'll appear here
        </p>
      </div>
    </div>
  );
};
