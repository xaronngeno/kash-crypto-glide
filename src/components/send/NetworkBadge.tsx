
import { cn } from '@/lib/utils';

interface NetworkBadgeProps {
  network: string;
}

const NetworkBadge = ({ network }: NetworkBadgeProps) => {
  let color = "bg-gray-100 text-gray-600";
  
  switch (network.toLowerCase()) {
    case 'bitcoin':
      color = "bg-amber-100 text-amber-600";
      break;
    case 'ethereum':
      color = "bg-indigo-100 text-indigo-600";
      break;
    case 'solana':
      color = "bg-purple-100 text-purple-600";
      break;
    case 'tron':
      color = "bg-red-100 text-red-600";
      break;
    case 'binance smart chain':
      color = "bg-yellow-100 text-yellow-700";
      break;
    case 'polygon':
      color = "bg-blue-100 text-blue-600";
      break;
  }
  
  return (
    <span className={cn(`text-xs px-2 py-0.5 rounded-full font-medium`, color)}>
      {network}
    </span>
  );
};

export default NetworkBadge;
