
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashInput } from '@/components/ui/KashInput';
import { Search } from 'lucide-react';
import { KashCard } from '@/components/ui/KashCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

// Token data with popularity ranking (market cap order)
const TOKENS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', decimals: 8, popularity: 1 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', decimals: 18, popularity: 2 },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: '₮', decimals: 6, popularity: 3 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: 'S', decimals: 9, popularity: 4 },
  { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', icon: 'B', decimals: 18, popularity: 5 },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', icon: 'X', decimals: 6, popularity: 6 },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', icon: 'A', decimals: 6, popularity: 7 },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: 'D', decimals: 8, popularity: 8 },
  { id: 'dot', name: 'Polkadot', symbol: 'DOT', icon: 'P', decimals: 10, popularity: 9 },
  { id: 'link', name: 'Chainlink', symbol: 'LINK', icon: 'L', decimals: 18, popularity: 10 },
];

const SearchCrypto = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { prices } = useCryptoPrices();

  // Filter tokens by search query
  const filteredTokens = TOKENS.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )
  // Sort tokens by popularity (lower number = more popular)
  .sort((a, b) => a.popularity - b.popularity);

  const handleTokenSelect = (tokenId: string) => {
    navigate(`/swap?token=${tokenId}`);
  };

  return (
    <MainLayout title="Search Crypto">
      <div className="flex flex-col gap-4">
        <KashInput
          label="Search for a cryptocurrency"
          icon={<Search size={16} className="text-gray-500" />}
          placeholder="Bitcoin, Ethereum, etc."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="space-y-2 mt-2">
          {filteredTokens.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No cryptocurrencies found</p>
          ) : (
            filteredTokens.map((token) => (
              <KashCard key={token.id} className="cursor-pointer hover:border-kash-green" onClick={() => handleTokenSelect(token.id)}>
                <div className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg">{token.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{token.name}</h3>
                      <p className="text-sm text-gray-500">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {prices && prices[token.symbol] ? (
                      <>
                        <span className="font-medium">${prices[token.symbol].price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        <span className={`text-xs ${prices[token.symbol].change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {prices[token.symbol].change_24h >= 0 ? '+' : ''}{prices[token.symbol].change_24h.toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-kash-green">
                        Swap
                      </Button>
                    )}
                  </div>
                </div>
              </KashCard>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchCrypto;
