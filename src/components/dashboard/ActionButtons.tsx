
import { Send, ArrowDownToLine, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '../ui/KashButton';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ActionButtonsProps {
  onForceCreateWallets?: () => void;
}

export const ActionButtons = ({ onForceCreateWallets }: ActionButtonsProps) => {
  const navigate = useNavigate();
  const [isRecreating, setIsRecreating] = useState(false);
  
  const handleRecreateClick = async () => {
    if (onForceCreateWallets) {
      setIsRecreating(true);
      toast({
        title: 'Recreating wallets',
        description: 'This may take a moment...',
      });
      
      try {
        await onForceCreateWallets();
        toast({
          title: 'Wallets updated',
          description: 'Your wallets have been recreated successfully.',
        });
      } catch (error) {
        console.error("Error recreating wallets:", error);
        toast({
          title: 'Error recreating wallets',
          description: 'There was a problem recreating your wallets. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsRecreating(false);
      }
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
          icon={<RefreshCw size={18} className={isRecreating ? "animate-spin" : ""} />}
          onClick={handleRecreateClick}
          disabled={isRecreating}
        >
          {isRecreating ? 'Creating...' : 'Recreate'}
        </KashButton>
      )}
    </div>
  );
};
