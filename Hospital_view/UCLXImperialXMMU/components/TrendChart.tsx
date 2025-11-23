import React, { useState } from 'react';
import { HistoryPoint } from '../types';

interface TrendChartProps {
  data: HistoryPoint[];
  label: string;
  color: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, label, color }) => {
  const [activePoint, setActivePoint] = useState<HistoryPoint | null>(null);

  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] text-sm font-mono">No Data Available</div>;

  // Simple Normalization
  const padding = 20;
  const width = 800;
  const height = 300;
  
  const minVal = 0;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.2; // Add headroom

  const getX = (index: number) => {
    return padding + (index / (data.length - 1)) * (width - 2 * padding);
  };

  const getY = (val: number) => {
    return height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  return (
    <div className="relative w-full h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-bold text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] uppercase tracking-widest">{label}</h4>
        {activePoint && (
          <div className="bg-[hsl(0,0%,14%)] dark:bg-[hsl(0,0%,9%)] text-[hsl(0,0%,90%)] px-3 py-1.5 rounded-[1.25rem] text-xs shadow-card z-10 absolute right-4 top-4 backdrop-blur-md border border-[hsl(0,0%,20%)]">
            <span className="text-[hsl(0,0%,60%)]">{new Date(activePoint.timestamp).toLocaleDateString()}</span>: 
            <span className="font-bold ml-2 text-lg">{activePoint.value}</span>
            {activePoint.type === 'restock' && <span className="ml-2 text-[hsl(142,71%,45%)] font-bold">(+RESTOCK)</span>}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        {/* Grid Lines - Soft and dashed */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-[hsl(0,0%,83%)] dark:stroke-[hsl(0,0%,20%)]" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-[hsl(0,0%,83%)] dark:stroke-[hsl(0,0%,20%)]" strokeWidth="1" strokeDasharray="4,4"/>

        {/* Gradient Definition for the Area Fill */}
        <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
                <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
        </defs>

        {/* Fill Area */}
        <polyline 
          points={`${getX(0)},${height-padding} ${points} ${getX(data.length-1)},${height-padding}`} 
          fill="url(#chartFill)" 
        />

        {/* The Line */}
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Interactive Points */}
        {data.map((d, i) => {
           const isRestock = d.type === 'restock';
           const isActive = activePoint === d;
           return (
            <g key={i} onClick={() => setActivePoint(d)} className="cursor-pointer group">
              {/* Invisible large hit area */}
              <circle cx={getX(i)} cy={getY(d.value)} r="20" fill="transparent" />
              
              {/* Visible dot */}
              <circle 
                cx={getX(i)} 
                cy={getY(d.value)} 
                r={isActive ? 8 : (isRestock ? 6 : 4)} 
                fill={isRestock ? 'hsl(142,71%,45%)' : color} 
                className="stroke-[hsl(0,0%,98%)] dark:stroke-[hsl(0,0%,9%)] transition-all duration-300 ease-out group-hover:r-8 shadow-sm"
                strokeWidth="2"
              />
              
              {/* Restock Halo */}
              {isRestock && (
                 <circle cx={getX(i)} cy={getY(d.value)} r="12" fill="none" stroke="hsl(142,71%,45%)" strokeWidth="1" opacity="0.5" />
              )}
            </g>
           );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] px-2 mt-2 font-mono uppercase tracking-widest">
         <span>7 Days Ago</span>
         <span>Today</span>
      </div>
    </div>
  );
};

export default TrendChart;