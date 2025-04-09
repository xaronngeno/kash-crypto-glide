
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TimeFilter = '1H' | '1D' | '1W' | '1M' | 'YTD' | 'ALL';

interface PriceDataPoint {
  timestamp: string;
  price: number;
}

interface PriceChartProps {
  priceData: any;
  timeframe: TimeFilter;
  color?: string;
}

const PriceChart = ({ priceData, timeframe, color = '#10B981' }: PriceChartProps) => {
  // Generate mock data based on the timeframe
  const generateMockData = () => {
    const mockData = [];
    const endPrice = priceData.price || 100;
    const change = priceData.change_24h || 0;
    
    // Calculate starting price based on the percent change
    const startPrice = endPrice / (1 + change / 100);
    
    // Generate different data points based on the timeframe
    let points = 24;
    let interval = "hour";
    
    switch (timeframe) {
      case '1H':
        points = 60;
        interval = "minute";
        break;
      case '1D':
        points = 24;
        interval = "hour";
        break;
      case '1W':
        points = 7;
        interval = "day";
        break;
      case '1M':
        points = 30;
        interval = "day";
        break;
      case 'YTD':
        points = 12;
        interval = "month";
        break;
      case 'ALL':
        points = 24;
        interval = "month";
        break;
      default:
        points = 24;
        interval = "hour";
    }
    
    // Create a price volatility simulation
    const volatility = Math.abs(change) / 100;
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      let timestamp;
      if (interval === "minute") {
        timestamp = new Date(now.getTime() - (points - i) * 60 * 1000);
      } else if (interval === "hour") {
        timestamp = new Date(now.getTime() - (points - i) * 60 * 60 * 1000);
      } else if (interval === "day") {
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
      } else {
        timestamp = new Date(now.getFullYear(), now.getMonth() - (points - i), now.getDate());
      }
      
      // Create progressive price changes
      const progressRatio = i / (points - 1);
      const randomFactor = (Math.random() - 0.5) * volatility * 2;
      const smoothedPrice = startPrice + (endPrice - startPrice) * progressRatio;
      const price = smoothedPrice * (1 + randomFactor);
      
      mockData.push({
        timestamp: timestamp.toISOString(),
        price: Math.max(0, price),
      });
    }
    
    return mockData;
  };
  
  const chartData = generateMockData();
  
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeframe) {
      case '1H':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1D':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1W':
        return date.toLocaleDateString([], { weekday: 'short' });
      case '1M':
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      case 'YTD':
      case 'ALL':
        return date.toLocaleDateString([], { month: 'short' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  const formatYAxis = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(1)}`;
    }
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(payload[0].payload.timestamp);
      let dateDisplay;
      
      switch (timeframe) {
        case '1H':
        case '1D':
          dateDisplay = date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          break;
        case '1W':
        case '1M':
          dateDisplay = date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          });
          break;
        case 'YTD':
        case 'ALL':
          dateDisplay = date.toLocaleDateString([], { 
            year: 'numeric',
            month: 'short', 
            day: 'numeric' 
          });
          break;
        default:
          dateDisplay = date.toLocaleString();
      }
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">{dateDisplay}</p>
          <p className="text-sm font-semibold text-gray-800">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 10, fill: '#888' }}
            tickCount={5}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            domain={['auto', 'auto']}
            tick={{ fontSize: 10, fill: '#888' }}
            orientation="right"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
