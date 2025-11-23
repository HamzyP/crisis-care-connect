import React, { useState } from 'react';
import { Hospital, ItemType } from '../types';
import { Wifi, WifiOff, Package, Users, Activity, RefreshCw, LayoutGrid, LayoutList } from './Icons';
import TrendChart from './TrendChart';

interface FrontlineViewProps {
  hospital: Hospital;
  isOnline: boolean;
  toggleConnection: () => void;
  onUpdateStock: (departmentId: string, itemId: string, delta: number) => void;
  onUpdatePatients: (count: number) => void;
  onUpdateSpecialists: (departmentId: string, delta: number) => void;
  pendingUpdatesCount: number;
}

// Ratios to determine max stock based on hospital patient capacity
const STOCK_RATIOS: Record<string, number> = {
  [ItemType.INSULIN]: 0.5,     
  [ItemType.ANTIBIOTICS]: 1.0, 
  [ItemType.ANESTHESIA]: 0.2,  
  [ItemType.O2]: 0.8,          
  [ItemType.FLUIDS]: 2.0,      // IV Fluids ratio
};

const FrontlineView: React.FC<FrontlineViewProps> = ({
  hospital,
  isOnline,
  toggleConnection,
  onUpdateStock,
  onUpdateSpecialists,
  pendingUpdatesCount
}) => {
  const [flashingItem, setFlashingItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'grid'>('detailed');
  const [editingQuantity, setEditingQuantity] = useState<{deptId: string, itemId: string, value: string} | null>(null);

  const handleUpdate = (departmentId: string, itemId: string, delta: number) => {
    onUpdateStock(departmentId, itemId, delta);
    setFlashingItem(itemId);
    setTimeout(() => setFlashingItem(null), 300);
  };

  const handleRestock = (departmentId: string, itemId: string, current: number, max: number) => {
    const delta = max - current;
    if (delta > 0) {
        handleUpdate(departmentId, itemId, delta);
    }
  };

  const handleQuantityChange = (deptId: string, itemId: string, currentQty: number) => {
    setEditingQuantity({ deptId, itemId, value: currentQty.toString() });
  };

  const handleQuantitySubmit = (deptId: string, itemId: string) => {
    if (editingQuantity) {
      const newValue = parseInt(editingQuantity.value) || 0;
      const currentQty = hospital.departments
        .find(d => d.id === deptId)?.inventory
        .find(i => i.id === itemId)?.quantity || 0;
      const delta = newValue - currentQty;
      if (delta !== 0) {
        handleUpdate(deptId, itemId, delta);
      }
      setEditingQuantity(null);
    }
  };

  const handleQuantityBlur = (deptId: string, itemId: string) => {
    handleQuantitySubmit(deptId, itemId);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent, deptId: string, itemId: string) => {
    if (e.key === 'Enter') {
      handleQuantitySubmit(deptId, itemId);
    } else if (e.key === 'Escape') {
      setEditingQuantity(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
      
      {/* Top Header Bar */}
      <div className={`
        p-6 rounded-[1.25rem] bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]
        flex flex-col sm:flex-row justify-between items-center gap-6 transition-all duration-300 shadow-card
      `}>
        <div>
          <h2 className="text-3xl font-black text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] flex items-center gap-3 tracking-tight font-serif">
             {hospital.name} 
             <span className="text-[10px] font-bold uppercase tracking-widest bg-[hsl(243,75%,58%)]/20 dark:bg-[hsl(234,89%,73%)]/20 text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)] px-3 py-1 rounded-full border border-[hsl(243,75%,58%)]/20 dark:border-[hsl(234,89%,73%)]/20">Pharmacy</span>
          </h2>
          <div className="mt-2 flex items-center gap-2 text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] text-sm font-medium">
             <div className="bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,14%)] p-1.5 rounded-full text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,70%)]">
                <Users className="w-4 h-4" />
             </div>
             CAPACITY: <span className="text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-bold">{hospital.maxPatients} PATIENTS</span>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,14%)] p-1 rounded-[1.25rem] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] backdrop-blur-sm">
                <button 
                    onClick={() => setViewMode('detailed')}
                    className={`p-2.5 rounded-[1.25rem] transition-all duration-300 ${viewMode === 'detailed' ? 'bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,18%)] text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)] shadow-sm' : 'text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,60%)] dark:hover:text-[hsl(0,0%,90%)]'}`}
                    title="Detailed View (Trends)"
                >
                    <LayoutList className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-[1.25rem] transition-all duration-300 ${viewMode === 'grid' ? 'bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,18%)] text-[hsl(243,75%,58%)] dark:text-[hsl(234,89%,73%)] shadow-sm' : 'text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,60%)] dark:hover:text-[hsl(0,0%,90%)]'}`}
                    title="Grid View (Rapid Entry)"
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>

            {!isOnline && (
                <div className="flex items-center gap-2 text-[hsl(45,93%,58%)] bg-[hsl(45,93%,58%)]/10 px-4 py-2.5 rounded-full border border-[hsl(45,93%,58%)]/20 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(45,93%,58%)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(45,93%,58%)]"></span>
                    </span>
                    <span className="text-xs font-bold hidden sm:inline">{pendingUpdatesCount} QUEUED</span>
                </div>
            )}
            
            <button 
            onClick={toggleConnection}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.25rem] text-sm font-bold transition-all shadow-sm active:scale-95 border backdrop-blur-md ${
                isOnline 
                ? 'bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30 hover:bg-[hsl(142,71%,45%)]/20' 
                : 'bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,14%)] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]'
            }`}
            >
            {isOnline ? <><Wifi className="w-4 h-4" /> ONLINE</> : <><WifiOff className="w-4 h-4" /> OFFLINE</>}
            </button>
        </div>
      </div>

      <div className="flex flex-col gap-12 pb-20">
        
        {hospital.departments.map(dept => (
            <div key={dept.id} className="animate-slide-up">
                {/* Department Header */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 pl-2">
                    <h3 className="text-xl font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] tracking-tight flex items-center gap-3 font-serif">
                      <span className="w-2 h-2 rounded-full bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)]"></span>
                      {dept.name}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-[hsl(0,0%,83%)] to-transparent dark:from-[hsl(0,0%,20%)]"></div>
                    
                    {/* Specialist Counter Control */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-[1.25rem] bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] shadow-sm backdrop-blur-sm self-start md:self-auto">
                        <span className="text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] text-[10px] font-bold uppercase tracking-wider mr-2">{dept.specialistTitle}</span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onUpdateSpecialists(dept.id, -1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,18%)] text-[hsl(0,0%,50%)] hover:bg-[hsl(243,75%,58%)]/10 hover:text-[hsl(243,75%,58%)] dark:hover:text-[hsl(234,89%,73%)] transition-colors text-sm shadow-sm"
                            >
                                -
                            </button>
                            <span className="text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-mono font-bold w-6 text-center text-lg leading-none">{dept.specialistCount}</span>
                            <button 
                                onClick={() => onUpdateSpecialists(dept.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,18%)] text-[hsl(0,0%,50%)] hover:bg-[hsl(243,75%,58%)]/10 hover:text-[hsl(243,75%,58%)] dark:hover:text-[hsl(234,89%,73%)] transition-colors text-sm shadow-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
                    {dept.inventory.map((item) => {
                        const maxStock = Math.floor(hospital.maxPatients * (STOCK_RATIOS[item.name] || 1));
                        const stockPercentage = (item.quantity / maxStock) * 100;
                        
                        // Status Logic
                        const daysSupply = item.quantity / item.dailyUsageRate;
                        const isCritical = daysSupply < 2;
                        const isLow = daysSupply < 5 && !isCritical;
                        const isFlashing = flashingItem === item.id;

                        // Colors based on status - Adjusted for Natural Theme
                        const statusColor = isCritical ? 'bg-[hsl(0,72%,50%)]' : isLow ? 'bg-[hsl(45,93%,58%)]' : 'bg-[hsl(142,71%,45%)]';
                        const statusText = isCritical ? 'text-[hsl(0,72%,50%)]' : isLow ? 'text-[hsl(45,93%,58%)]' : 'text-[hsl(142,71%,45%)]';
                        const glowClass = isCritical ? '' : isLow ? '' : '';

                        return (
                        <div 
                            key={item.id} 
                            className={`group relative bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] rounded-[1.25rem] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] shadow-card hover:shadow-layered transition-all duration-500 ${
                                viewMode === 'detailed' ? 'grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden' : 'rounded-3xl flex flex-col overflow-hidden'
                            } ${isCritical ? 'border-danger/30' : 'border-white/60 dark:border-white/10'}`}
                        >
                            {/* LEFT: Controls */}
                            <div className={`
                                ${viewMode === 'detailed' ? 'lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r' : 'flex-1 border-b-0'}
                                p-8 border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] flex flex-col justify-between relative transition-colors duration-300
                                ${isFlashing ? 'bg-[hsl(243,75%,58%)]/10 dark:bg-[hsl(234,89%,73%)]/20' : ''}
                            `}>
                                {/* Status Indicator Dot */}
                                <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${statusColor} ${glowClass} transition-colors duration-500`}></div>
                                {isCritical && <div className="absolute top-6 right-10 text-[10px] font-bold text-danger animate-pulse">CRITICAL</div>}
                                
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2.5 rounded-[1.25rem] shadow-sm ${isCritical ? 'bg-[hsl(0,72%,50%)]/10 text-[hsl(0,72%,50%)]' : 'bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)]'}`}>
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-lg text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] tracking-tight">{item.name}</h3>
                                    </div>
                                    
                                    <div className="flex items-baseline gap-2 mt-6">
                                        {editingQuantity?.deptId === dept.id && editingQuantity?.itemId === item.id ? (
                                          <input
                                            type="number"
                                            min="0"
                                            max={maxStock}
                                            value={editingQuantity.value}
                                            onChange={(e) => setEditingQuantity({ ...editingQuantity, value: e.target.value })}
                                            onBlur={() => handleQuantityBlur(dept.id, item.id)}
                                            onKeyDown={(e) => handleQuantityKeyDown(e, dept.id, item.id)}
                                            className={`text-5xl font-medium tracking-tighter ${statusText} dark:text-white bg-transparent border-2 border-[hsl(243,75%,58%)] dark:border-[hsl(234,89%,73%)] rounded-[1.25rem] px-4 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-[hsl(243,75%,58%)] dark:focus:ring-[hsl(234,89%,73%)] transition-colors duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                            autoFocus
                                          />
                                        ) : (
                                          <span className={`text-5xl font-medium tracking-tighter ${statusText} dark:text-white transition-colors duration-300`}>
                                            {item.quantity}
                                          </span>
                                        )}
                                        <span className="text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] text-xs font-bold uppercase tracking-wider">/ {maxStock} Max</span>
                                    </div>
                                    
                                    {/* Clean Progress Bar */}
                                    <div className="w-full bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,14%)] h-2 rounded-full mt-6 overflow-hidden">
                                        <div 
                                            className={`h-full ${statusColor} transition-all duration-700 ease-out rounded-full relative`}
                                            style={{ width: `${Math.min(100, stockPercentage)}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-50"></div>
                                        </div>
                                    </div>
                                    
                                    <div className={`mt-4 text-xs font-medium flex items-center gap-1.5 ${statusText} opacity-80`}>
                                        <Activity className="w-3.5 h-3.5" />
                                        {(item.quantity / item.dailyUsageRate).toFixed(1)} Days Supply
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto pt-6 border-t border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]">
                                    <button 
                                        onClick={() => handleUpdate(dept.id, item.id, -1)}
                                        className="flex-1 bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] hover:bg-[hsl(0,0%,96%)] dark:hover:bg-[hsl(0,0%,18%)] text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] py-3 rounded-[1.25rem] text-2xl font-medium transition-all border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] active:scale-95 shadow-sm flex justify-center items-center"
                                        title="Decrease by 1"
                                    >
                                        −
                                    </button>
                                    <button 
                                        onClick={() => handleQuantityChange(dept.id, item.id, item.quantity)}
                                        className="flex-1 bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] hover:bg-[hsl(0,0%,96%)] dark:hover:bg-[hsl(0,0%,18%)] text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] py-3 rounded-[1.25rem] text-sm font-bold transition-all border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] active:scale-95 shadow-sm flex justify-center items-center gap-2"
                                        title="Set exact quantity"
                                    >
                                        Set Qty
                                    </button>
                                    <button 
                                        onClick={() => handleRestock(dept.id, item.id, item.quantity, maxStock)}
                                        className="flex-[2] bg-[hsl(243,75%,58%)] dark:bg-[hsl(234,89%,73%)] hover:opacity-90 text-white py-3 rounded-[1.25rem] text-xs font-bold transition-all shadow-card active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Restock
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT: Trend Graph - Only shown in Detailed View */}
                            {viewMode === 'detailed' && (
                                <div className="lg:col-span-8 xl:col-span-9 p-8 bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] min-h-[280px] relative rounded-[1.25rem] border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)]">
                                    <TrendChart 
                                        data={item.history} 
                                        label={`${item.name} Usage Trend`} 
                                        color={isCritical ? 'hsl(0,72%,50%)' : isLow ? 'hsl(45,93%,58%)' : 'hsl(142,71%,45%)'} 
                                    />
                                    
                                    {/* Inline Stats for Desktop */}
                                    <div className="absolute top-8 right-8 hidden md:flex gap-10 text-xs font-mono">
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] font-bold mb-1 tracking-widest">Max Cap</span>
                                            <span className="text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-bold text-lg">{maxStock}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase text-[hsl(0,0%,50%)] dark:text-[hsl(0,0%,60%)] font-bold mb-1 tracking-widest">Avg Usage</span>
                                            <span className="text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] font-bold text-lg">~{item.dailyUsageRate}/d</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>
        ))}
        
      </div>
    </div>
  );
};

export default FrontlineView;