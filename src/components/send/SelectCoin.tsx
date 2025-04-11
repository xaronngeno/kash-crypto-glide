
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KashCard } from '@/components/ui/KashCard';
import { Token } from '@/utils/tokenUtils';
import { ArrowRight } from 'lucide-react';

interface SelectCoinProps {
  availableTokens: Token[];
  onSelectToken: (token: Token) => void;
}

const SelectCoin = ({ availableTokens, onSelectToken }: SelectCoinProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = availableTokens.filter((token) => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <KashCard className="p-5">
      <div className="mb-4">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredTokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectToken(token)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={token.logo} alt={token.name} />
                  <AvatarFallback>{token.symbol[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{token.symbol}</h3>
                  <p className="text-sm text-gray-500">{token.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-2">
                  <p className="font-medium">{token.balance?.toLocaleString('en-US', { maximumFractionDigits: 6 })}</p>
                  {token.value && (
                    <p className="text-sm text-gray-500">${token.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                  )}
                </div>
                <ArrowRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))}
          
          {filteredTokens.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cryptocurrencies found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </KashCard>
  );
};

export default SelectCoin;
