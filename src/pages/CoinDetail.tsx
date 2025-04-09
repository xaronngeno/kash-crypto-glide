import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  ChevronDown, 
  TrendingUp,
  DollarSign, 
  Clock, 
  Globe, 
  MessageSquare, 
  CheckCircle, 
  X as XIcon, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PriceChart from '@/components/crypto/PriceChart';
import { useWallets } from '@/hooks/useWallets';
import { Asset } from '@/types/assets';

type TimeFilter = '1H' | '1D' | '1W' | '1M' | 'YTD' | 'ALL';

const CoinDetail = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { prices, loading, error } = useCryptoPrices();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFilter>('1D');
  const { assets } = useWallets({ prices: prices || {} });
  const [darkMode, setDarkMode] = useState(false);

  const coin = !loading && prices ? 
    Object.entries(prices).find(([symbol, data]) => 
      symbol.toLowerCase() === coinId || data.name?.toLowerCase() === coinId
    ) : null;

  const coinSymbol = coin ? coin[0] : '';
  const coinData = coin ? coin[1] : null;
  
  const userAsset: Asset | undefined = assets.find(
    (asset) => asset.symbol.toLowerCase() === coinSymbol.toLowerCase()
  );

  const userBalance = userAsset?.amount || 0;
  const userBalanceValue = userBalance * (coinData?.price || 0);
  
  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChangeStyle = (value: number) => {
    return value >= 0 
      ? 'text-green-500' 
      : 'text-red-500';
  };

  const getPerformanceValue = (key: string) => {
    if (!coinData) return { value: '0', change: '0%', positive: true };
    
    switch(key) {
      case 'Volume':
        return { 
          value: `$${(coinData.volume || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}B`, 
          change: '+3.55%', 
          positive: true 
        };
      case 'Trades':
        return { 
          value: '26.06M', 
          change: '-0.09%', 
          positive: false 
        };
      case 'Traders':
        return { 
          value: '1.48M', 
          change: '-13.57%', 
          positive: false 
        };
      default:
        return { value: '0', change: '0%', positive: true };
    }
  };

  const getChangeValue = () => {
    if (!coinData) return { value: 0, formatted: '$0.00' };
    
    const changePercent = coinData.change_24h || 0;
    const priceValue = coinData.price || 0;
    const changeValue = priceValue * (changePercent / 100);
    
    return {
      value: changePercent,
      formatted: `$${Math.abs(changeValue).toFixed(2)}`
    };
  };

  const getMarketData = () => {
    if (!coinData || !coinSymbol) return null;
    
    const data = {
      marketCap: coinData.marketCap || coinData.price * 1000000,
      totalSupply: 0,
      circulatingSupply: 0
    };
    
    switch(coinSymbol.toUpperCase()) {
      case 'SOL':
        data.totalSupply = 598.13;
        data.circulatingSupply = 515.59;
        break;
      case 'BTC':
        data.totalSupply = 21;
        data.circulatingSupply = 19.68;
        break;
      case 'ETH':
        data.totalSupply = 120.22;
        data.circulatingSupply = 120.22;
        break;
      default:
        data.circulatingSupply = data.marketCap / (coinData.price || 1);
        data.totalSupply = data.circulatingSupply * 1.2;
    }
    
    return data;
  };

  const marketData = getMarketData();

  if (loading) {
    return (
      <MainLayout title="Coin Details" showBack>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-16 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-10" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!coin || !coinData) {
    return (
      <MainLayout title="Not Found" showBack>
        <div className="flex flex-col items-center justify-center py-12">
          <XIcon className="w-12 h-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Coin Not Found</h2>
          <p className="text-gray-500 mb-6 text-center">
            We couldn't find information for this cryptocurrency.
          </p>
          <KashButton 
            onClick={() => navigate('/search')}
            className="bg-kash-green text-white"
          >
            Back to Search
          </KashButton>
        </div>
      </MainLayout>
    );
  }

  const change = getChangeValue();
  const changeColor = coinData.change_24h >= 0 ? 'text-green-500' : 'text-red-500';
  const changeBackground = coinData.change_24h >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <MainLayout title={coinData.name || coinSymbol} showBack>
      <div className="flex flex-col gap-4">
        

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-1">{coinData.name}</h1>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold">${coinData.price.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            <div className="flex items-center">
              <span className={`${changeColor} text-lg font-medium`}>{change.formatted}</span>
              <Badge variant="outline" className={`ml-1 ${changeColor} ${changeBackground}`}>
                {coinData.change_24h >= 0 ? '+' : ''}{coinData.change_24h.toFixed(2)}%
              </Badge>
            </div>
          </div>
          <p className="text-gray-500 text-sm">{getFormattedDate()}</p>
        </div>

        <div className="rounded-xl border p-2 overflow-hidden">
          <PriceChart 
            priceData={coinData}
            timeframe={selectedTimeframe} 
            color={coinData.change_24h >= 0 ? '#10B981' : '#EF4444'}
            
          />
          
          <div className="flex justify-between pt-2">
            {['1H', '1D', '1W', '1M', 'YTD', 'ALL'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period as TimeFilter)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTimeframe === period 
                    ? 'bg-gray-100 font-medium text-gray-800'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <KashButton 
            variant="outline"
            className="flex flex-col items-center justify-center py-3 h-auto"
            onClick={() => navigate('/receive')}
          >
            <div className="text-indigo-500 mb-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-xs">Receive</span>
          </KashButton>
          
          <KashButton 
            variant="outline"
            className="flex flex-col items-center justify-center py-3 h-auto"
            onClick={() => navigate(`/swap?token=${coinId}`)}
          >
            <div className="text-indigo-500 mb-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 4V20M17 20L13 16M17 20L21 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 20V4M7 4L3 8M7 4L11 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xs">Swap</span>
          </KashButton>
          
          <KashButton 
            variant="outline"
            className="flex flex-col items-center justify-center py-3 h-auto"
            onClick={() => navigate('/buy')}
          >
            <div className="text-indigo-500 mb-1">
              <DollarSign size={20} />
            </div>
            <span className="text-xs">Cash Buy</span>
          </KashButton>
          
          <KashButton 
            variant="outline"
            className="flex flex-col items-center justify-center py-3 h-auto"
          >
            <div className="text-indigo-500 mb-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="6" cy="12" r="2" fill="currentColor"/>
                <circle cx="18" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xs">More</span>
          </KashButton>
        </div>

        <div className="mb-4">
          <h2 className="text-gray-600 mb-2">Your Balance</h2>
          <KashCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    src={coinData.logo} 
                    alt={coinData.name}
                    className="w-10 h-10 rounded-full bg-gray-100 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20dy%3D%226%22%3E${coinSymbol.charAt(0)}%3C%2Ftext%3E%3C%2Fsvg%3E`;
                    }}
                  />
                  {coinData.platform && coinData.platform.logo && (
                    <div className="absolute -bottom-1 -right-1 rounded-full overflow-hidden bg-white border-2 border-white w-5 h-5">
                      <img 
                        src={coinData.platform.logo}
                        alt={coinData.platform.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-lg">{coinData.name}</h3>
                  <p className="text-gray-500">{userBalance} {coinSymbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${userBalanceValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                <p className="text-gray-500">${(userBalance * coinData.price).toFixed(2)}</p>
              </div>
            </div>
          </KashCard>
        </div>

        {coinSymbol === 'SOL' && (
          <div className="mb-4">
            <h2 className="text-gray-600 mb-2">Staking</h2>
            <KashCard className="bg-gray-800 text-white p-4 hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium">Start earning {coinSymbol}</h3>
                  <p className="text-gray-400 text-sm">Stake tokens and earn rewards</p>
                </div>
                <ArrowUpRight size={18} className="ml-auto text-gray-400" />
              </div>
            </KashCard>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-gray-600 mb-2">About</h2>
          <KashCard className="p-4">
            {coinSymbol === 'SOL' ? (
              <>
                <p className="text-gray-700">
                  Solana is a highly functional open source project that banks on blockchain technology's permissionless nature to provide decentralized finance (DeFi) solutions.
                </p>
                <button className="text-indigo-500 mt-2">Show More</button>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <KashButton 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 px-3"
                    onClick={() => window.open('https://solana.com', '_blank')}
                  >
                    <Globe size={14} /> Website
                  </KashButton>
                  <KashButton 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 px-3"
                    onClick={() => window.open('https://t.me/solana', '_blank')}
                  >
                    <MessageSquare size={14} /> Telegram
                  </KashButton>
                  <KashButton 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 px-3"
                    onClick={() => window.open('https://twitter.com/solana', '_blank')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg> X
                  </KashButton>
                </div>
              </>
            ) : (
              <p className="text-center py-2 text-gray-500">No description available.</p>
            )}
          </KashCard>
        </div>

        <div className="mb-4">
          <h2 className="text-gray-600 mb-2">Info</h2>
          <KashCard className="overflow-hidden">
            <div className="divide-y">
              <div className="flex justify-between p-4">
                <span className="text-gray-500">Symbol</span>
                <span className="font-medium">{coinSymbol}</span>
              </div>
              
              <div className="flex justify-between p-4">
                <span className="text-gray-500">Network</span>
                <span className="font-medium">
                  {coinData.platform?.name || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between p-4">
                <span className="text-gray-500">Market Cap</span>
                <span className="font-medium">
                  ${((marketData?.marketCap || 0) / 1000000000).toLocaleString(undefined, {maximumFractionDigits: 2})}B
                </span>
              </div>
              
              {marketData && (
                <>
                  <div className="flex justify-between p-4">
                    <span className="text-gray-500">Total Supply</span>
                    <span className="font-medium">
                      {marketData.totalSupply.toLocaleString(undefined, {maximumFractionDigits: 2})}M
                    </span>
                  </div>
                  <div className="flex justify-between p-4">
                    <span className="text-gray-500">Circulating Supply</span>
                    <span className="font-medium">
                      {marketData.circulatingSupply.toLocaleString(undefined, {maximumFractionDigits: 2})}M
                    </span>
                  </div>
                </>
              )}
            </div>
          </KashCard>
        </div>

        <div className="mb-4">
          <h2 className="text-gray-600 mb-2">24h Performance</h2>
          <KashCard className="overflow-hidden">
            <div className="divide-y">
              {['Volume', 'Trades', 'Traders'].map((key) => {
                const performanceData = getPerformanceValue(key);
                
                return (
                  <div key={key} className="flex justify-between p-4">
                    <span className="text-gray-500">{key}</span>
                    <div className="text-right">
                      <span className="font-medium block">{performanceData.value}</span>
                      <span className={performanceData.positive ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                        {performanceData.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </KashCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default CoinDetail;
