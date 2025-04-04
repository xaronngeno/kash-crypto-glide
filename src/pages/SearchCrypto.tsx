
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashInput } from '@/components/ui/KashInput';
import { Search } from 'lucide-react';
import { KashCard } from '@/components/ui/KashCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Skeleton } from '@/components/ui/skeleton';

const SearchCrypto = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { prices, loading } = useCryptoPrices();

  // Convert prices object to array for easier filtering
  const tokensArray = Object.entries(prices || {}).map(([symbol, data]) => ({
    id: symbol.toLowerCase(),
    name: data.name || symbol,
    symbol: symbol,
    logo: data.logo || '',
    platform: data.platform || { name: '', logo: '' },
    price: data.price,
    change_24h: data.change_24h,
  }));
  
  // Filter tokens by search query
  const filteredTokens = tokensArray.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  // Sort by price (market cap) descending
  .sort((a, b) => b.price - a.price);

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
          {loading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 5 }).map((_, i) => (
              <KashCard key={`skeleton-${i}`} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-12 mt-1" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </KashCard>
            ))
          ) : filteredTokens.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No cryptocurrencies found</p>
          ) : (
            filteredTokens.map((token) => (
              <KashCard key={token.id} className="cursor-pointer hover:border-kash-green" onClick={() => handleTokenSelect(token.id)}>
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={token.logo} 
                        alt={token.name}
                        className="w-10 h-10 rounded-full bg-gray-100 object-contain"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20dy%3D%226%22%3E${token.symbol.charAt(0)}%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                      />
                      {token.platform && token.platform.logo && (
                        <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white overflow-hidden bg-white w-5 h-5">
                          <img 
                            src={token.platform.logo} 
                            alt={token.platform.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback if platform logo fails
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{token.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">{token.symbol}</span>
                        {token.platform && token.platform.name && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                            {token.platform.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium">${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className={`text-xs ${token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                    </span>
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
