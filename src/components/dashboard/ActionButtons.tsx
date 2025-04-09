
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Repeat, CreditCard } from 'lucide-react';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';

export const ActionButtons = () => {
  return (
    <KashCard 
      variant="outline" 
      padding="md" 
      className="grid grid-cols-4 gap-2 w-full"
    >
      <Link 
        to="/receive" 
        className="w-full border border-kash-green rounded-lg transition-all hover:border-opacity-80"
      >
        <KashButton 
          variant="ghost"
          fullWidth
          className="flex-col h-20"
          icon={<ArrowDownRight size={20} className="mb-1" />}
        >
          <span>Receive</span>
        </KashButton>
      </Link>
      <Link 
        to="/send" 
        className="w-full border border-kash-green rounded-lg transition-all hover:border-opacity-80"
      >
        <KashButton
          variant="ghost"
          fullWidth
          className="flex-col h-20"
          icon={<ArrowUpRight size={20} className="mb-1" />}
        >
          <span>Send</span>
        </KashButton>
      </Link>
      <Link 
        to="/swap" 
        className="w-full border border-kash-green rounded-lg transition-all hover:border-opacity-80"
      >
        <KashButton
          variant="ghost"
          fullWidth
          className="flex-col h-20"
          icon={<Repeat size={20} className="mb-1" />}
        >
          <span>Swap</span>
        </KashButton>
      </Link>
      <Link 
        to="/buy" 
        className="w-full border border-kash-green rounded-lg transition-all hover:border-opacity-80"
      >
        <KashButton
          variant="ghost"
          fullWidth
          className="flex-col h-20"
          icon={<CreditCard size={20} className="mb-1" />}
        >
          <span>Buy</span>
        </KashButton>
      </Link>
    </KashCard>
  );
};
