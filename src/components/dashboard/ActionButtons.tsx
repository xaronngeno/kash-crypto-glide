
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Send, ArrowDown, Wallet } from "lucide-react";

interface ActionButtonsProps {
  onForceCreateWallets?: () => Promise<any>;
}

export const ActionButtons = ({ onForceCreateWallets }: ActionButtonsProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex gap-3 justify-center">
      <Button 
        onClick={() => navigate('/send')}
        variant="outline" 
        className="bg-white flex gap-2 items-center border border-gray-200 hover:bg-gray-50"
      >
        <Send size={15} className="text-gray-800" />
        <span className="text-gray-800">Send</span>
      </Button>
      
      <Button
        onClick={() => navigate('/receive')}
        variant="outline"
        className="bg-white flex gap-2 items-center border border-gray-200 hover:bg-gray-50"
      >
        <ArrowDown size={15} className="text-gray-800" />
        <span className="text-gray-800">Receive</span>
      </Button>
      
      <Button
        onClick={() => navigate('/buy')}
        className="bg-kash-green flex gap-2 items-center hover:bg-kash-green/90 text-white"
      >
        <Wallet size={15} className="text-white" />
        <span>Buy</span>
      </Button>
    </div>
  );
};
