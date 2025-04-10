
import { Send, ArrowDownToLine, Repeat, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '../ui/KashButton';

interface ActionButtonsProps {
  onForceCreateWallets?: () => void;
}

export const ActionButtons = ({ onForceCreateWallets }: ActionButtonsProps) => {
  const navigate = useNavigate();

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
          icon={<RefreshCcw size={18} />}
          onClick={onForceCreateWallets}
        >
          Recreate
        </KashButton>
      )}
    </div>
  );
};
