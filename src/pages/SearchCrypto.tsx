
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { KashInput } from '@/components/ui/KashInput';
import { Search, ChevronDown } from 'lucide-react';
import { KashCard } from '@/components/ui/KashCard';
import { useNavigate } from 'react-router-dom';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TimeFilter = '24h' | '7d' | '30d';
type NetworkFilter = 'All' | 'Ethereum' | 'Solana' | 'Bitcoin' | 'Polygon' | 'Base';
type TokenFilter = 'Trending' | 'All' | 'Favorites';
type TrendingMetric = 'Trending' | 'Volume' | 'Price' | 'Price Change' | 'Market Cap';

const SearchCrypto = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('Trending');
  const [trendingMetric, setTrendingMetric] = useState<TrendingMetric>('Trending');
  
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
    volume: data.volume || 0,
    marketCap: data.marketCap || data.price * 1000000, // Fallback calculation
  }));
  
  // Filter tokens by search query and network
  const filteredTokens = tokensArray.filter(token => {
    const matchesSearch = 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (token.platform?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesNetwork = 
      networkFilter === 'All' || 
      token.platform?.name === networkFilter ||
      (networkFilter === 'Solana' && !token.platform); // Default to Solana if no platform specified
      
    return matchesSearch && matchesNetwork;
  })
  // Sort based on the selected trending metric
  .sort((a, b) => {
    switch (trendingMetric) {
      case 'Volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'Price':
        return b.price - a.price;
      case 'Price Change':
        return getChangeValue(b) - getChangeValue(a);
      case 'Market Cap':
        return (b.marketCap || 0) - (a.marketCap || 0);
      default: // Default "Trending" uses price change
        return getChangeValue(b) - getChangeValue(a);
    }
  });

  const handleTokenSelect = (tokenId: string) => {
    navigate(`/swap?token=${tokenId}`);
  };

  const getChangeValue = (token: any): number => {
    switch (timeFilter) {
      case '7d':
        return token.change_7d || token.change_24h || 0;
      case '30d':
        return token.change_30d || token.change_24h || 0;
      default:
        return token.change_24h || 0;
    }
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

        {/* Filter section with three distinct areas */}
        <div className="space-y-3 mb-4">
          {/* Token type filter with dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                {trendingMetric} <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-black text-white rounded-lg border-none shadow-lg p-1 min-w-[160px]">
                <DropdownMenuItem 
                  className="hover:bg-gray-800 rounded-md cursor-pointer px-3 py-2"
                  onClick={() => setTrendingMetric("Trending")}
                >
                  Trending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-gray-800 rounded-md cursor-pointer px-3 py-2"
                  onClick={() => setTrendingMetric("Volume")}
                >
                  Volume
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-gray-800 rounded-md cursor-pointer px-3 py-2"
                  onClick={() => setTrendingMetric("Price")}
                >
                  Price
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-gray-800 rounded-md cursor-pointer px-3 py-2"
                  onClick={() => setTrendingMetric("Price Change")}
                >
                  Price Change
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-gray-800 rounded-md cursor-pointer px-3 py-2"
                  onClick={() => setTrendingMetric("Market Cap")}
                >
                  Market Cap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="ml-2 flex-1">
              <ToggleGroup 
                type="single" 
                value={tokenFilter} 
                onValueChange={(value) => value && setTokenFilter(value as TokenFilter)}
                className="justify-start w-full bg-gray-100 p-1 rounded-full"
              >
                <ToggleGroupItem 
                  value="Trending" 
                  className={`rounded-full px-4 py-2 text-sm ${tokenFilter === 'Trending' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
                >
                  Trending
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="Favorites" 
                  className={`rounded-full px-4 py-2 text-sm ${tokenFilter === 'Favorites' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
                >
                  Favorites
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="All" 
                  className={`rounded-full px-4 py-2 text-sm ${tokenFilter === 'All' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
                >
                  All
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          
          {/* Network filter (Solana, Ethereum, etc.) */}
          <div className="overflow-x-auto pb-1">
            <ToggleGroup 
              type="single" 
              value={networkFilter} 
              onValueChange={(value) => value && setNetworkFilter(value as NetworkFilter)}
              className="justify-start w-max bg-gray-100 p-1 rounded-full"
            >
              <ToggleGroupItem 
                value="All" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'All' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="Solana" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'Solana' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                Solana
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="Ethereum" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'Ethereum' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                Ethereum
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="Bitcoin" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'Bitcoin' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                Bitcoin
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="Base" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'Base' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                Base
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="Polygon" 
                className={`rounded-full px-4 py-2 text-sm ${networkFilter === 'Polygon' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
              >
                Polygon
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Time period filter (24h, 7d, 30d) */}
          <ToggleGroup 
            type="single" 
            value={timeFilter} 
            onValueChange={(value) => value && setTimeFilter(value as TimeFilter)}
            className="justify-start w-full bg-gray-100 p-1 rounded-full"
          >
            <ToggleGroupItem 
              value="24h" 
              className={`rounded-full px-4 py-2 text-sm ${timeFilter === '24h' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
            >
              24h
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="7d" 
              className={`rounded-full px-4 py-2 text-sm ${timeFilter === '7d' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
            >
              7d
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="30d" 
              className={`rounded-full px-4 py-2 text-sm ${timeFilter === '30d' ? 'bg-kash-green text-white' : 'text-gray-600'}`}
            >
              30d
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

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
                    <span className={`text-xs ${getChangeValue(token) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {getChangeValue(token) >= 0 ? '+' : ''}{getChangeValue(token).toFixed(2)}%
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
