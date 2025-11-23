import React, { useState } from 'react';
import { Hospital, LogEntry, ItemType } from '../types';
import TacticalMap from './TacticalMap';
import TrendChart from './TrendChart';
import { Activity, BrainCircuit, RefreshCw, TrendingUp, Users } from './Icons';
import { analyzeLogistics } from '../services/geminiService';

interface CommandCenterProps {
  hospitals: Hospital[];
  logs: LogEntry[];
}

const CommandCenterView: React.FC<CommandCenterProps> = ({ hospitals, logs }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | 'Patients'>('Patients');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeLogistics(hospitals);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // Prepare data for the chart - AGGREGATING ALL HOSPITALS
  let chartData;
  let chartColor = 'hsl(243, 75%, 58%)'; // Primary indigo default
  let chartLabel = '';

  if (selectedItemType === 'Patients') {
     // Sum patient counts across all hospitals per day
     const mapDateToCount = new Map<string, number>();
     hospitals.forEach(h => {
         h.patientCensus.forEach(p => {
             const current = mapDateToCount.get(p.date) || 0;
             mapDateToCount.set(p.date, current + p.count);
         });
     });
     
     // Convert map to sorted array
     chartData = Array.from(mapDateToCount.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, count]) => ({
            timestamp: new Date(date).getTime(),
            value: count,
            type: 'manual_update' as const
        }));

     chartColor = 'hsl(45, 93%, 58%)'; // Warning yellow
     chartLabel = 'Network-Wide Patient Census';
  } else {
     // Aggregate inventory item history across all hospitals
     // We assume all hospitals have roughly the same timestamp intervals in mock data for simplicity
     // We will take the first item of this type we find to get the timestamps, then sum values
     const sampleItem = hospitals[0]?.departments.flatMap(d => d.inventory).find(i => i.name === selectedItemType);
     
     if (sampleItem && sampleItem.history.length > 0) {
         chartData = sampleItem.history.map((point, index) => {
             let totalValue = 0;
             hospitals.forEach(h => {
                 h.departments.forEach(d => {
                     const item = d.inventory.find(i => i.name === selectedItemType);
                     if (item && item.history[index]) {
                         totalValue += item.history[index].value;
                     }
                 });
             });
             return {
                 ...point,
                 value: totalValue
             };
         });
     } else {
         chartData = [];
     }
     
     chartColor = 'hsl(243, 75%, 58%)'; // Primary indigo
     chartLabel = `Total Network ${selectedItemType}`;
  }

  return (
    <div className="h-full flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] pb-6 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] tracking-tighter flex items-center gap-3 font-serif">
            COMMAND <span className="text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)]">NEXUS</span>
          </h1>
          <p className="text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] font-mono text-xs tracking-widest mt-1 pl-1">LIVE LOGISTICS FEED // GAZA SECTOR</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] px-6 py-3 rounded-[1.25rem] shadow-subtle border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] backdrop-blur-sm">
            <div className="text-right">
                <div className="text-[10px] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] uppercase font-bold tracking-wider mb-0.5">Network Status</div>
                <div className="text-[hsl(142,71%,45%)] font-bold flex items-center gap-2 justify-end text-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(142,71%,45%)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(142,71%,45%)]"></span>
                    </span>
                    ONLINE
                </div>
            </div>
            <div className="h-8 w-px bg-[hsl(0,0%,83%)] dark:bg-[hsl(0,0%,20%)]"></div>
            <div className="text-right">
                <div className="text-[10px] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] uppercase font-bold tracking-wider mb-0.5">Active Nodes</div>
                <div className="text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-bold text-sm">
                    {hospitals.filter(h => h.isOnline !== false).length} / {hospitals.length}
                </div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Main Map & Analysis Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-[hsl(0,0%,9%)] rounded-[1.25rem] border border-[hsl(0,0%,20%)] shadow-layered overflow-hidden relative group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(243,75%,58%)] via-[hsl(45,93%,58%)] to-[hsl(142,71%,45%)] opacity-80"></div>
             <TacticalMap hospitals={hospitals} />
          </div>

          {/* New Analytics Section */}
          <div className="bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] p-8 flex flex-col gap-6 shadow-card border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] flex items-center gap-3 font-serif">
                  <div className="bg-[hsl(243,75%,58%)]/10 dark:bg-[hsl(234,89%,73%)]/20 p-2 rounded-[1.25rem] text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  NETWORK SUPPLY ANALYTICS
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                   {/* Quick Toggles */}
                   <button
                        onClick={() => setSelectedItemType('Patients')}
                        className={`px-5 py-2 text-xs font-bold rounded-[1.25rem] transition-all whitespace-nowrap border flex items-center gap-2 ${
                           selectedItemType === 'Patients' 
                           ? 'bg-[hsl(45,93%,58%)] text-white border-[hsl(45,93%,58%)] shadow-lg shadow-[hsl(45,93%,58%)]/20' 
                           : 'bg-transparent text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,60%)] dark:hover:text-[hsl(0,0%,90%)] border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,96%)] dark:hover:bg-[hsl(0,0%,18%)]'
                        }`}
                      >
                         <Users className="w-3 h-3" /> Patients
                   </button>
                   {([ItemType.INSULIN, ItemType.ANTIBIOTICS, ItemType.O2] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedItemType(type)}
                        className={`px-5 py-2 text-xs font-bold rounded-[1.25rem] transition-all whitespace-nowrap border ${
                           selectedItemType === type 
                           ? 'bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] text-white border-[hsl(243,75%,58%)] dark:border-[hsl(234,89%,73%)] shadow-lg shadow-[hsl(243,75%,58%)]/20' 
                           : 'bg-transparent text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,60%)] dark:hover:text-[hsl(0,0%,90%)] border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,96%)] dark:hover:bg-[hsl(0,0%,18%)]'
                        }`}
                      >
                         {type}
                      </button>
                   ))}
                </div>
             </div>
             
             <div className="h-64 bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] p-2 border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]">
                <TrendChart data={chartData} label={chartLabel} color={chartColor} />
             </div>
          </div>

          {/* AI Analyst Section */}
          <div className="bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] p-8 relative overflow-hidden shadow-card group">
             <div className="absolute -right-10 -bottom-10 p-4 opacity-5 dark:opacity-5 pointer-events-none transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-6">
                <BrainCircuit className="w-64 h-64 text-[hsl(243,75%,58%)]" />
             </div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-lg font-bold text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)] flex items-center gap-3 font-serif">
                     <BrainCircuit className="w-6 h-6" />
                     GEMINI LOGISTICS ANALYST
                   </h3>
                   <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] hover:opacity-90 text-white px-6 py-2.5 rounded-[1.25rem] text-sm font-bold flex items-center gap-2 transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                   >
                      {isAnalyzing ? <RefreshCw className="animate-spin w-4 h-4"/> : 'RUN ANALYSIS'}
                   </button>
                </div>
                
                <div className="bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] p-6 border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] min-h-[120px]">
                  {isAnalyzing ? (
                    <div className="flex space-x-2 items-center justify-center h-full py-6 text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)]">
                       <span className="w-2 h-2 bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] rounded-full animate-bounce" style={{animationDelay:'0s'}}></span>
                       <span className="w-2 h-2 bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                       <span className="w-2 h-2 bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                       <span className="ml-3 font-mono text-sm font-bold">Analyzing network vectors...</span>
                    </div>
                  ) : analysis ? (
                    <p className="font-mono text-sm text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] leading-relaxed">
                      {analysis}
                    </p>
                  ) : (
                    <p className="text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] text-sm italic text-center py-6">
                      Ready to analyze network supply levels for critical shortages.
                    </p>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Feed - Now Shows ALL logs naturally */}
        <div className="bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] flex flex-col overflow-hidden h-[600px] lg:h-auto shadow-card border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] order-first lg:order-last">
          <div className="p-6 border-b border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)]">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] flex items-center gap-3 text-xs uppercase tracking-widest font-serif">
                <Activity className="w-4 h-4 text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)]" />
                Global Request Feed
                </h3>
                <span className="bg-[hsl(0,72%,50%)]/10 text-[hsl(0,72%,50%)] text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,9%)]">
            {logs.length === 0 ? (
               <div className="text-center text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] py-12 text-sm italic">No activity logged.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start p-4 rounded-[1.25rem] bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] hover:scale-[1.02] transition-all duration-300 group shadow-subtle">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-shadow duration-300 ${
                    log.type === 'critical' ? 'bg-[hsl(0,72%,50%)]' : 
                    log.type === 'warning' ? 'bg-[hsl(45,93%,58%)]' : 
                    'bg-[hsl(142,71%,45%)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline w-full mb-1">
                       <span className="text-xs font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] uppercase tracking-wider truncate pr-2">{log.hospitalName}</span>
                       <span className="text-[10px] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] font-mono whitespace-nowrap">
                         {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                    </div>
                    <p className="text-sm text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-medium leading-snug">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterView;