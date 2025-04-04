
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
  icon: string;
  decimals: number;
  platform?: Platform;
  logo?: string;
}

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  tokens: Token[];
}

const TokenSelector = ({ selectedToken, onSelectToken, tokens }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { prices, loading } = useCryptoPrices();

  // Enhance tokens with logo and platform data if available
  const enhancedTokens = tokens.map(token => {
    const priceData = prices[token.symbol];
    return {
      ...token,
      logo: priceData?.logo || token.icon || '',
      platform: priceData?.platform || { name: '', logo: '' },
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
        className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {selectedToken.logo ? (
              <img 
                src={selectedToken.logo} 
                alt={selectedToken.name}
                className="w-8 h-8 rounded-full bg-gray-100 object-contain"
                onError={(e) => {
                  // Fallback to text icon if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = selectedToken.symbol.charAt(0);
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span>{selectedToken.icon || selectedToken.symbol.charAt(0)}</span>
              </div>
            )}
            {selectedToken.platform && selectedToken.platform.logo && (
              <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white overflow-hidden bg-white w-4 h-4">
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
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center gap-3 w-full p-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : filteredTokens.length === 0 ? (
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
                  <div className="relative">
                    {token.logo ? (
                      <img 
                        src={token.logo}
                        alt={token.name}
                        className="w-8 h-8 rounded-full bg-gray-100 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.charAt(0);
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span>{token.icon || token.symbol.charAt(0)}</span>
                      </div>
                    )}
                    {token.platform && token.platform.logo && (
                      <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white overflow-hidden bg-white w-4 h-4">
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
                      <span className="text-sm text-gray-500">{token.name}</span>
                      {token.platform?.name && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
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
