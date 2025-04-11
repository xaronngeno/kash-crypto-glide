
import { Info, ArrowRight } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashCard } from '@/components/ui/KashCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Token, calculateFee } from '@/utils/tokenUtils';
import { getNetworkLogo } from '@/utils/networkUtils';

interface SelectNetworkProps {
  selectedToken: Token;
  onNetworkSelect: (network: string) => void;
  onBack: () => void;
}

const SelectNetwork = ({ selectedToken, onNetworkSelect, onBack }: SelectNetworkProps) => {
  return (
    <KashCard className="p-5">
      <div className="flex items-center mb-6">
        <KashButton 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-2"
        >
          Back
        </KashButton>
        
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={selectedToken.logo} alt={selectedToken.symbol} />
            <AvatarFallback>{selectedToken.symbol[0]}</AvatarFallback>
          </Avatar>
          <h3 className="font-medium">{selectedToken.symbol}</h3>
        </div>
      </div>

      <h3 className="font-medium mb-3">Select Network</h3>
      <div className="space-y-2">
        {selectedToken.networks?.map((network) => (
          <div
            key={network}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => onNetworkSelect(network)}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getNetworkLogo(network)} alt={network} />
                <AvatarFallback>{network[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{network}</h3>
                <p className="text-xs text-gray-500">
                  Fee: ~{calculateFee(selectedToken.symbol, network)} {selectedToken.symbol}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </div>
        ))}
      </div>
      
      <div className="mt-4 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start">
          <Info size={18} className="text-blue-500 mr-2 mt-0.5" />
          <p className="text-sm text-blue-700">
            Make sure to select the network that matches the recipient's address. Sending to the wrong network may result in lost funds.
          </p>
        </div>
      </div>
    </KashCard>
  );
};

export default SelectNetwork;
