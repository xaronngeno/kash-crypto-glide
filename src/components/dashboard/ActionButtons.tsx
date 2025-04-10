
import { Send, ArrowDownToLine, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '../ui/KashButton';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ActionButtonsProps {
  onForceCreateWallets?: () => Promise<any>;
}

export const ActionButtons = ({ onForceCreateWallets }: ActionButtonsProps) => {
  const navigate = useNavigate();
  const [isRecreating, setIsRecreating] = useState(false);
  
  const handleRecreateClick = async () => {
    if (!onForceCreateWallets) return;
    
    setIsRecreating(true);
    toast({
      title: 'Creating wallets',
      description: 'This may take a moment...',
    });
    
    try {
      await onForceCreateWallets();
      toast({
        title: 'Success',
        description: 'Your wallets have been created successfully!',
      });
    } catch (error) {
      console.error("Error recreating wallets:", error);
      toast({
        title: 'Error',
        description: 'There was a problem creating your wallets.',
        variant: 'destructive',
      });
    } finally {
      setIsRecreating(false);
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
          {isRecreating ? 'Creating...' : 'Create Wallets'}
        </KashButton>
      )}
    </div>
  );
};
