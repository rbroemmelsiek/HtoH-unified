
import React, { useState } from 'react';
import { BarChart3, PieChart, Activity, TrendingUp, Maximize2, CircleDot, ScatterChart } from 'lucide-react';

interface GraphWidgetProps {
  onExpand?: () => void;
}

// Mock Data Sets
const DATA_SETS = [
  { label: "Revenue", color: "bg-indigo-500", borderColor: "border-indigo-500", textColor: "text-indigo-600" },
  { label: "Expenses", color: "bg-rose-500", borderColor: "border-rose-500", textColor: "text-rose-600" },
  { label: "Net Income", color: "bg-emerald-500", borderColor: "border-emerald-500", textColor: "text-emerald-600" }
];

// Sample values (Months 1-12)
const SAMPLE_DATA = {
  0: [65, 59, 80, 81, 56, 55, 40, 60, 75, 85, 90, 100], // Revenue
  1: [45, 40, 50, 55, 40, 45, 35, 48, 50, 55, 60, 65],  // Expenses
  2: [20, 19, 30, 26, 16, 10, 5, 12, 25, 30, 30, 35]    // Net Income
};

type ChartType = 'bar' | 'pie' | 'line' | 'average' | 'scatter';

export const GraphWidget: React.FC<GraphWidgetProps> = ({ onExpand }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [scale, setScale] = useState(100); // Percentage scale

  const maxValue = Math.max(...Object.values(SAMPLE_DATA).flat()) * 1.2; // Buffer for scaling

  // Render Bar Chart
  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full gap-1 pt-4">
      {SAMPLE_DATA[0].map((val1, i) => {
        const val2 = SAMPLE_DATA[1][i];
        const val3 = SAMPLE_DATA[2][i];
        const h1 = (val1 / maxValue) * 100 * (scale / 100);
        const h2 = (val2 / maxValue) * 100 * (scale / 100);
        const h3 = (val3 / maxValue) * 100 * (scale / 100);

        return (
          <div key={i} className="flex flex-col justify-end h-full w-full gap-0.5 group relative">
            <div className="w-full bg-indigo-500 rounded-t-sm opacity-90 hover:opacity-100 transition-all" style={{ height: `${h1}%` }}></div>
            <div className="w-full bg-rose-500 rounded-t-sm opacity-90 hover:opacity-100 transition-all" style={{ height: `${h2}%` }}></div>
            <div className="w-full bg-emerald-500 rounded-t-sm opacity-90 hover:opacity-100 transition-all" style={{ height: `${h3}%` }}></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[10px] p-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
              M{i+1}: ${val1}k / ${val2}k / ${val3}k
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Line Chart (SVG)
  const renderLineChart = (type: 'line' | 'average') => {
    // Simple polyline generation
    const width = 100; // Viewbox width
    const height = 100; // Viewbox height
    const step = width / (SAMPLE_DATA[0].length - 1);

    const getPoints = (dataIndex: 0 | 1 | 2) => {
      return SAMPLE_DATA[dataIndex].map((val, i) => {
        let v = val;
        if (type === 'average') {
           // Simple running avg calculation for demo
           const slice = SAMPLE_DATA[dataIndex].slice(0, i + 1);
           v = slice.reduce((a, b) => a + b, 0) / slice.length;
        }
        const x = i * step;
        const y = height - ((v / maxValue) * height * (scale / 100));
        return `${x},${y}`;
      }).join(' ');
    };

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {/* Grid Lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />

        {/* Lines */}
        <polyline points={getPoints(0)} fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-sm" />
        <polyline points={getPoints(1)} fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-sm" />
        <polyline points={getPoints(2)} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-sm" />
      </svg>
    );
  };

  // Render Pie Chart
  const renderPieChart = () => {
    // Sums for simple pie visualization
    const sum1 = SAMPLE_DATA[0].reduce((a, b) => a + b, 0);
    const sum2 = SAMPLE_DATA[1].reduce((a, b) => a + b, 0);
    const sum3 = SAMPLE_DATA[2].reduce((a, b) => a + b, 0);
    const total = sum1 + sum2 + sum3;
    
    const p1 = (sum1 / total) * 360;
    const p2 = (sum2 / total) * 360;
    
    const conicGradient = `conic-gradient(
      #6366f1 0deg ${p1}deg, 
      #f43f5e ${p1}deg ${p1 + p2}deg, 
      #10b981 ${p1 + p2}deg 360deg
    )`;

    return (
      <div className="flex items-center justify-center h-full">
        <div 
          className="w-32 h-32 rounded-full shadow-lg relative transition-all duration-500"
          style={{ background: conicGradient, transform: `scale(${scale/100})` }}
        >
          <div className="absolute inset-0 m-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-400">
             Total
          </div>
        </div>
      </div>
    );
  };

  // Render Scatter Plot
  const renderScatterChart = () => (
    <div className="relative w-full h-full border-l border-b border-gray-200">
       {SAMPLE_DATA[0].map((val, i) => (
         <React.Fragment key={i}>
           {/* Set 1 */}
           <div 
             className="absolute w-1.5 h-1.5 bg-indigo-500 rounded-full hover:scale-150 transition-transform"
             style={{ 
               left: `${(i / 11) * 100}%`, 
               bottom: `${(val / maxValue) * 100 * (scale/100)}%` 
             }}
             title={`Rev: ${val}`}
           />
           {/* Set 2 */}
           <div 
             className="absolute w-1.5 h-1.5 bg-rose-500 rounded-full hover:scale-150 transition-transform"
             style={{ 
               left: `${(i / 11) * 100}%`, 
               bottom: `${(SAMPLE_DATA[1][i] / maxValue) * 100 * (scale/100)}%` 
             }}
             title={`Exp: ${SAMPLE_DATA[1][i]}`}
           />
            {/* Set 3 */}
            <div 
             className="absolute w-1.5 h-1.5 bg-emerald-500 rounded-full hover:scale-150 transition-transform"
             style={{ 
               left: `${(i / 11) * 100}%`, 
               bottom: `${(SAMPLE_DATA[2][i] / maxValue) * 100 * (scale/100)}%` 
             }}
             title={`Net: ${SAMPLE_DATA[2][i]}`}
           />
         </React.Fragment>
       ))}
    </div>
  );

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mt-2 animate-fade-in overflow-hidden group flex flex-col"
      onClick={onExpand}
    >
      {/* Header / Toolbar */}
      <div className="bg-gray-50 p-2 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setChartType('bar'); }} className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`} title="Bar Chart"><BarChart3 size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setChartType('line'); }} className={`p-1.5 rounded ${chartType === 'line' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`} title="Line Chart"><Activity size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setChartType('pie'); }} className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`} title="Pie Chart"><PieChart size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setChartType('average'); }} className={`p-1.5 rounded ${chartType === 'average' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`} title="Running Avg"><TrendingUp size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setChartType('scatter'); }} className={`p-1.5 rounded ${chartType === 'scatter' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`} title="Scatter Plot"><ScatterChart size={14} /></button>
        </div>
        
        {onExpand && (
          <button className="p-1.5 rounded-full bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] opacity-0 group-hover:opacity-100 transition-all">
            <Maximize2 size={14} />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 py-2 text-[10px] border-b border-gray-50">
        {DATA_SETS.map((ds, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${ds.color}`}></div>
            <span className="text-gray-600 font-medium">{ds.label}</span>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="h-48 p-4 relative">
        {chartType === 'bar' && renderBarChart()}
        {(chartType === 'line' || chartType === 'average') && renderLineChart(chartType)}
        {chartType === 'pie' && renderPieChart()}
        {chartType === 'scatter' && renderScatterChart()}
      </div>

      {/* Scale Slider */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
         <span className="text-[10px] font-bold text-gray-400 uppercase">Scale Y</span>
         <input 
           type="range" 
           min="50" 
           max="150" 
           value={scale} 
           onChange={(e) => setScale(parseInt(e.target.value))}
           className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
         />
         <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{scale}%</span>
      </div>
    </div>
  );
};
