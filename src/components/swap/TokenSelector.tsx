
import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader
} from '@/components/ui/dialog';
import { ChevronDown, Search } from 'lucide-react';
import { KashInput } from '@/components/ui/KashInput';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Skeleton } from '@/components/ui/skeleton';

interface Platform {
  name: string;
  logo: string;
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string; // Required
  decimals: number;
  platform?: Platform;
  logo?: string;
  price?: number;
}

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  tokens: Token[];
  darkMode?: boolean;
}

const TokenSelector = ({ selectedToken, onSelectToken, tokens, darkMode = false }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { prices, loading } = useCryptoPrices();

  // Enhance tokens with logo and platform data if available
  const enhancedTokens = tokens.map(token => {
    const priceData = prices[token.symbol];
    return {
      ...token,
      logo: priceData?.logo || token.logo || token.icon || '',
      platform: priceData?.platform || token.platform || { name: '', logo: '' },
    };
  });

  const filteredTokens = enhancedTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (token.platform?.name && token.platform.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
        className={`flex items-center gap-2 ${darkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-white' 
          : 'bg-white hover:bg-gray-50 text-gray-900'} px-3 py-2 rounded-full`}
      >
        <div className="relative">
          {selectedToken.logo ? (
            <img 
              src={selectedToken.logo} 
              alt={selectedToken.name}
              className="w-6 h-6 rounded-full bg-gray-800 object-contain"
              onError={(e) => {
                // Fallback to text icon if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = selectedToken.symbol.charAt(0);
              }}
            />
          ) : (
            <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
              <span>{selectedToken.icon || selectedToken.symbol.charAt(0)}</span>
            </div>
          )}
          {selectedToken.platform && selectedToken.platform.logo && (
            <div className={`absolute -bottom-1 -right-1 rounded-full border-2 ${darkMode ? 'border-gray-800' : 'border-white'} overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'} w-3 h-3`}>
              <img 
                src={selectedToken.platform.logo}
                alt={selectedToken.platform.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        <div className="font-medium">{selectedToken.symbol}</div>
        <ChevronDown size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : ""}>Select Token</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <KashInput
              icon={<Search size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />}
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={darkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
            />
          </div>
          
          <div className="mt-2 max-h-60 overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center gap-3 w-full p-3">
                  <Skeleton className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className="flex flex-col gap-1">
                    <Skeleton className={`h-4 w-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    <Skeleton className={`h-3 w-24 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  </div>
                </div>
              ))
            ) : filteredTokens.length === 0 ? (
              <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  className={`flex items-center gap-3 w-full p-3 ${darkMode 
                    ? 'hover:bg-gray-800 text-white' 
                    : 'hover:bg-gray-50 text-gray-900'} rounded-lg`}
                  onClick={() => handleSelect(token)}
                >
                  <div className="relative">
                    {token.logo ? (
                      <img 
                        src={token.logo}
                        alt={token.name}
                        className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} object-contain`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.charAt(0);
                        }}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                        <span>{token.icon || token.symbol.charAt(0)}</span>
                      </div>
                    )}
                    {token.platform && token.platform.logo && (
                      <div className={`absolute -bottom-1 -right-1 rounded-full border-2 ${darkMode ? 'border-gray-900' : 'border-white'} overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} w-4 h-4`}>
                        <img 
                          src={token.platform.logo}
                          alt={token.platform.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{token.symbol}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.name}</span>
                      {token.platform?.name && (
                        <span className={`text-xs ${darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100'} px-1 rounded`}>
                          {token.platform.name}
                        </span>
                      )}
                    </div>
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
