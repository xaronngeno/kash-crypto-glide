
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PriceChartProps {
  priceData: any;
  timeframe: string;
  color: string;
  darkMode?: boolean; // Explicitly defined darkMode prop
}

const PriceChart: React.FC<PriceChartProps> = ({ priceData, timeframe, color, darkMode = false }) => {
  // Generate mock data based on the current price and change percentage
  const generateChartData = () => {
    const price = priceData.price || 100;
    const change = priceData.change_24h || 0;
    const dataPoints = 24; // Number of data points
    
    const data = [];
    const volatility = Math.abs(change) * 0.1;
    const trend = change / dataPoints;
    
    // Start with the current price minus the total expected change
    let startPrice = price / (1 + (change / 100));
    
    for (let i = 0; i < dataPoints; i++) {
      // Add some random noise to make it look more realistic
      const noise = (Math.random() - 0.5) * volatility;
      // Calculate the price for this point with some randomness
      const pointPrice = startPrice + (startPrice * trend * i) + noise;
      
      data.push({
        time: i,
        price: pointPrice
      });
    }
    
    return data;
  };
  
  const chartData = generateChartData();
  
  // Format the price display
  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={false}
            stroke={darkMode ? "#6b7280" : "#e5e7eb"} 
          />
          <YAxis 
            domain={['dataMin', 'dataMax']} 
            axisLine={false} 
            tickLine={false} 
            tick={false}
            stroke={darkMode ? "#6b7280" : "#e5e7eb"}
          />
          <Tooltip 
            formatter={formatPrice} 
            labelFormatter={() => ''} 
            contentStyle={{
              backgroundColor: darkMode ? '#1f2937' : 'white',
              borderColor: darkMode ? '#374151' : '#e5e7eb',
              color: darkMode ? 'white' : 'black'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
