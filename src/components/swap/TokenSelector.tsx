
import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader
} from '@/components/ui/dialog';
import { ChevronDown, Search } from 'lucide-react';
import { KashInput } from '@/components/ui/KashInput';

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
}

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  tokens: Token[];
}

const TokenSelector = ({ selectedToken, onSelectToken, tokens }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span>{selectedToken.icon}</span>
          </div>
          <div className="font-medium">{selectedToken.symbol}</div>
        </div>
        <ChevronDown size={20} className="text-gray-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Token</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <KashInput
              icon={<Search size={16} className="text-gray-500" />}
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="mt-2 max-h-60 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg"
                  onClick={() => handleSelect(token)}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span>{token.icon}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-500">{token.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TokenSelector;
