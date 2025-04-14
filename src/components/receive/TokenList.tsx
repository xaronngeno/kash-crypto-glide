
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Token } from '@/types/token';
import { CryptoPrices } from '@/hooks/useCryptoPrices';

interface TokenListProps {
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  searchTerm: string;
  prices: CryptoPrices;
}

export const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  onTokenSelect, 
  searchTerm,
  prices 
}) => {
  const filterTokens = (tokens: Token[]) => {
    if (!searchTerm) {
      return tokens;
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return tokens.filter(token => {
      const nameMatch = token.name.toLowerCase().includes(lowercaseSearch);
      const symbolMatch = token.symbol.toLowerCase().includes(lowercaseSearch);
      return nameMatch || symbolMatch;
    });
  };

  const filteredTokens = filterTokens(tokens);

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {filteredTokens.map((token) => (
        <div
          key={token.id}
          className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onTokenSelect(token)}
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
            {prices[token.symbol] && (
              <span className="text-sm text-gray-500 mr-2">
                ${prices[token.symbol].price.toLocaleString()}
              </span>
            )}
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
  );
};
