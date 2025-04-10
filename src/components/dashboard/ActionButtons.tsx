
import { Send, ArrowDownToLine, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '../ui/KashButton';
import { toast } from '@/hooks/use-toast';

interface ActionButtonsProps {
  onForceCreateWallets?: () => void;
}

export const ActionButtons = ({ onForceCreateWallets }: ActionButtonsProps) => {
  const navigate = useNavigate();
  
  const handleRecreateClick = () => {
    if (onForceCreateWallets) {
      toast({
        title: 'Recreating wallets',
        description: 'This may take a moment...',
      });
      onForceCreateWallets();
    }
  };

  return (
    <div className="flex space-x-3">
      <KashButton 
        variant="outline" 
        icon={<ArrowDownToLine size={18} />}
        onClick={() => navigate('/receive')}
      >
        Receive
      </KashButton>
      <KashButton 
        variant="outline" 
        icon={<Send size={18} />}
        onClick={() => navigate('/send')}
      >
        Send
      </KashButton>
      {onForceCreateWallets && (
        <KashButton
          variant="outline"
          icon={<RefreshCw size={18} />}
          onClick={handleRecreateClick}
        >
          Recreate
        </KashButton>
      )}
    </div>
  );
};
