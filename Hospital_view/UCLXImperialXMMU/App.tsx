import React, { useState, useEffect, useCallback } from 'react';
import { Hospital, ItemType, LogEntry, PendingUpdate, InventoryItem, HistoryPoint, Department } from './types';
import FrontlineView from './components/FrontlineView';
import { Sun, Moon } from './components/Icons';
import { aggregateHospitalResources, syncHospitalDataToMinistry } from '../../src/utils/hospitalSync';

// --- MOCK HISTORY GENERATOR ---
const generateHistory = (baseQty: number, volatility: number = 5): HistoryPoint[] => {
  const history: HistoryPoint[] = [];
  let currentQty = baseQty;
  const now = Date.now();
  
  for (let i = 6; i >= 0; i--) {
    const time = now - (i * 24 * 60 * 60 * 1000);
    // Simulate some usage and restock
    if (i !== 0) { 
        const change = Math.floor(Math.random() * volatility * 2) - volatility; 
        currentQty += change;
        if (currentQty < 0) currentQty = 0;
    }
    
    // Occasionally simulate a restock event in history
    const isRestock = i === 3 && Math.random() > 0.5;
    if (isRestock) currentQty += 50;

    history.push({
      timestamp: time,
      value: currentQty,
      type: isRestock ? 'restock' : 'usage'
    });
  }
  return history;
};

const generatePatientHistory = (): {date: string, count: number}[] => {
  const history = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toISOString().split('T')[0],
      count: 150 + Math.floor(Math.random() * 100)
    });
  }
  return history;
};

// --- MOCK INITIAL DATA ---
const createItem = (id: string, name: ItemType, qty: number, usage: number): InventoryItem => ({
  id, name, quantity: qty, dailyUsageRate: usage, history: generateHistory(qty)
});

const createDepartment = (id: string, name: string, specialistTitle: string, specialistCount: number, items: InventoryItem[]): Department => ({
    id, name, specialistTitle, specialistCount, inventory: items
});

// Updated Coordinates for Gaza Map Geometry (Roughly North to South)
const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'Indonesian Hospital', // North
    maxPatients: 600,
    coordinates: { x: 400, y: 120 }, // Top of map
    patientCensus: generatePatientHistory(),
    departments: [
        createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 15, [
            createItem('i1', ItemType.FLUIDS, 300, 22),
            createItem('i2', ItemType.O2, 60, 8),
        ]),
        createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 10, [
            createItem('i4', ItemType.ANESTHESIA, 50, 5),
            createItem('i5', ItemType.ANTIBIOTICS, 150, 15),
        ]),
        createDepartment('d3', 'Pediatrics', 'Pediatricians', 6, [
            createItem('i6', ItemType.INSULIN, 200, 12),
        ])
    ]
  },
  {
    id: 'h2',
    name: 'Al-Shifa Hospital', // Gaza City (Central/North)
    maxPatients: 500,
    coordinates: { x: 380, y: 250 },
    patientCensus: generatePatientHistory(),
    departments: [
        createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 12, [
            createItem('i1', ItemType.FLUIDS, 200, 25),
            createItem('i2', ItemType.O2, 50, 8),
        ]),
        createDepartment('d2', 'Oncology & Hematology', 'Oncologists', 8, [
            createItem('i4', ItemType.ANESTHESIA, 8, 5),
            createItem('i5', ItemType.ANTIBIOTICS, 45, 20),
        ]),
        createDepartment('d3', 'Urology & Nephrology', 'Urologists', 5, [
            createItem('i6', ItemType.INSULIN, 120, 15),
        ])
    ]
  },
  {
    id: 'h3',
    name: 'Al-Aqsa Martyrs', // Deir al-Balah (Central)
    maxPatients: 400,
    coordinates: { x: 350, y: 420 },
    patientCensus: generatePatientHistory(),
    departments: [
        createDepartment('d1', 'Trauma & Emergency', 'ER Physicians', 9, [
            createItem('i1', ItemType.FLUIDS, 90, 20),
            createItem('i2', ItemType.O2, 80, 9),
        ]),
        createDepartment('d2', 'Neurology', 'Neurologists', 6, [
            createItem('i4', ItemType.ANESTHESIA, 15, 6),
            createItem('i5', ItemType.ANTIBIOTICS, 60, 15),
        ]),
        createDepartment('d3', 'Urology & Nephrology', 'Urologists', 4, [
            createItem('i6', ItemType.INSULIN, 40, 14),
        ])
    ]
  },
  {
    id: 'h4',
    name: 'Nasser Medical', // Khan Younis (South)
    maxPatients: 300,
    coordinates: { x: 330, y: 580 }, // Bottom of map
    patientCensus: generatePatientHistory(),
    departments: [
        createDepartment('d1', 'Trauma & Emergency', 'ER Physicians', 8, [
            createItem('i1', ItemType.FLUIDS, 150, 20),
            createItem('i2', ItemType.O2, 20, 10),
        ]),
        createDepartment('d2', 'Surgery & Orthopedics', 'Orthopedic Surgeons', 5, [
            createItem('i4', ItemType.ANESTHESIA, 30, 4),
            createItem('i5', ItemType.ANTIBIOTICS, 100, 12),
        ]),
        createDepartment('d3', 'Endocrinology', 'Endocrinologists', 3, [
            createItem('i6', ItemType.INSULIN, 80, 10),
        ])
    ]
  }
];

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false); // Default to Light Mode based on prompt preference
  
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'l1', timestamp: Date.now() - 100000, message: 'Initial network sync complete.', type: 'info', hospitalName: 'System' }
  ]);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);

  // Handle Dark Mode
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const addLog = (message: string, type: LogEntry['type'], hospitalName: string) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type,
      hospitalName
    }, ...prev]);
  };

  const updateHospitalState = (hospitalId: string, departmentId: string, itemId: string, delta: number) => {
    setHospitals(prevHospitals => 
      prevHospitals.map(h => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          departments: h.departments.map(d => {
            if (d.id !== departmentId) return d;
            return {
                ...d,
                inventory: d.inventory.map(i => {
                    if (i.id !== itemId) return i;
                    const newQty = Math.max(0, i.quantity + delta);
                    
                    const newHistoryPoint: HistoryPoint = {
                      timestamp: Date.now(),
                      value: newQty,
                      type: delta > 0 ? 'restock' : 'usage'
                    };
                    const updatedHistory = [...i.history, newHistoryPoint].slice(-20); 
                    
                    return { ...i, quantity: newQty, history: updatedHistory };
                })
            };
          })
        };
      })
    );
  };

  const handleSpecialistUpdate = (hospitalId: string, departmentId: string, delta: number) => {
    setHospitals(prev => prev.map(h => {
        if (h.id !== hospitalId) return h;
        return {
            ...h,
            departments: h.departments.map(d => {
                if (d.id !== departmentId) return d;
                return { ...d, specialistCount: Math.max(0, d.specialistCount + delta) };
            })
        };
    }));
  };

  const handlePatientUpdate = (hospitalId: string, count: number) => {
    const targetHospital = hospitals.find(h => h.id === hospitalId);
    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      const today = new Date().toISOString().split('T')[0];
      const existingToday = h.patientCensus.find(p => p.date === today);
      let newCensus;
      
      if (existingToday) {
        newCensus = h.patientCensus.map(p => p.date === today ? { ...p, count } : p);
      } else {
        newCensus = [...h.patientCensus, { date: today, count }];
      }
      
      return { ...h, patientCensus: newCensus };
    }));
    
    if (targetHospital) {
      addLog(`Patient census updated: ${count}`, 'info', targetHospital.name);
    }
  };

  const handleStockUpdate = useCallback((hospitalId: string, departmentId: string, itemId: string, delta: number) => {
    const isOfflineMode = !isOnline;
    
    if (isOfflineMode) {
      const newUpdate: PendingUpdate = {
        id: Math.random().toString(),
        itemId,
        departmentId,
        delta,
        timestamp: Date.now()
      };
      setPendingUpdates(prev => [...prev, newUpdate]);
      updateHospitalState(hospitalId, departmentId, itemId, delta);
    } else {
      updateHospitalState(hospitalId, departmentId, itemId, delta);
      // Find names for logging
      const hospital = hospitals.find(h => h.id === hospitalId);
      const dept = hospital?.departments.find(d => d.id === departmentId);
      const item = dept?.inventory.find(i => i.id === itemId);
      
      if (hospital && item) {
        const action = delta > 0 ? 'Restocked' : 'Dispensed';
        addLog(`${action} ${item.name} in ${dept?.name}`, delta < 0 ? 'warning' : 'success', hospital.name);
      }
    }
  }, [isOnline, hospitals]);

  useEffect(() => {
    if (isOnline && pendingUpdates.length > 0) {
      const timer = setTimeout(() => {
        addLog(`Synced ${pendingUpdates.length} offline records.`, 'info', 'System');
        setPendingUpdates([]); 
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingUpdates]);

  // Simulation Logic - Skip Indonesian Hospital (h1) to prevent desyncing with MOH view
  useEffect(() => {
    // Auto-deplete inventory to simulate usage (but not for Indonesian Hospital)

    const interval = setInterval(() => {
      // Filter out Indonesian Hospital from auto-depletion
      const otherHospitals = hospitals.filter(h => h.id !== 'h1');
      if (otherHospitals.length === 0) return;
      
      const randomHospitalIndex = Math.floor(Math.random() * otherHospitals.length);
      const h = otherHospitals[randomHospitalIndex];
      const randomDeptIndex = Math.floor(Math.random() * h.departments.length);
      const d = h.departments[randomDeptIndex];
      const randomItemIndex = Math.floor(Math.random() * d.inventory.length);
      const i = d.inventory[randomItemIndex];
      
      if (i.quantity > 0 && Math.random() > 0.7) { 
        updateHospitalState(h.id, d.id, i.id, -1);
        if ((i.quantity - 1) / i.dailyUsageRate < 2) {
          addLog(`CRITICAL LOW: ${i.name} in ${d.name}`, 'critical', h.name);
        }
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [hospitals]);

  const currentHospital = hospitals.find(h => h.id === 'h1')!;

  // Update document title with hospital name
  useEffect(() => {
    if (currentHospital) {
      document.title = `${currentHospital.name} | Crisis Logistics`;
    }
  }, [currentHospital]);

  // Sync Indonesian Hospital data to Ministry View whenever hospitals state changes
  // This ensures we catch all updates (inventory, patients, staff)
  useEffect(() => {
    const indonesianHospital = hospitals.find(h => h.id === 'h1');
    if (indonesianHospital) {
      // Debug: Log all IV Fluids items before aggregation
      const allFluidsItems = indonesianHospital.departments.flatMap(dept => 
        dept.inventory.filter(item => item.name === ItemType.FLUIDS).map(item => ({
          dept: dept.name,
          quantity: item.quantity,
          dailyUsageRate: item.dailyUsageRate,
        }))
      );
      console.log('[Hospital Sync] All IV Fluids items before aggregation:', allFluidsItems);
      const totalFluids = allFluidsItems.reduce((sum, item) => sum + item.quantity, 0);
      console.log('[Hospital Sync] Total IV Fluids calculated:', totalFluids);
      
      const { resources, dailyUsageRates } = aggregateHospitalResources(
        indonesianHospital.departments.map(dept => ({
          inventory: dept.inventory.map(item => ({
            name: item.name,
            quantity: item.quantity,
            dailyUsageRate: item.dailyUsageRate,
          })),
        }))
      );
      
      console.log('[Hospital Sync] Aggregated IV Fluids:', resources.ivFluids);
      
      const currentPatients = indonesianHospital.patientCensus[indonesianHospital.patientCensus.length - 1]?.count || 0;
      
      syncHospitalDataToMinistry({
        resources,
        dailyUsageRates,
        currentPatients,
        maxPatientsCapacity: indonesianHospital.maxPatients,
        departments: indonesianHospital.departments.map(dept => ({
          id: dept.id,
          name: dept.name,
          specialistTitle: dept.specialistTitle,
          specialistCount: dept.specialistCount,
        })),
      });
    }
  }, [hospitals]); // Watch the entire hospitals array for any changes

  return (
    <div className="min-h-screen font-sans transition-all duration-700 ease-in-out bg-[hsl(0,0%,96%)] dark:bg-[hsl(0,0%,9%)] text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] relative overflow-x-hidden">
      
      {/* Theme Toggle */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-6 right-6 z-50 p-3 rounded-[1.25rem] bg-[hsl(0,0%,98%)] dark:bg-[hsl(0,0%,14%)] text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,90%)] backdrop-blur-md border border-[hsl(0,0%,83%)] dark:border-[hsl(0,0%,20%)] shadow-card hover:scale-110 transition-all duration-300 group"
        title="Toggle Theme"
      >
        {darkMode ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
      </button>

      <main className="relative z-10 pt-10 pb-32 px-4 md:px-8 lg:px-12 transition-opacity duration-500 max-w-[1600px] mx-auto">
        <FrontlineView 
          hospital={currentHospital} 
          isOnline={isOnline} 
          toggleConnection={() => setIsOnline(!isOnline)}
          onUpdateStock={(deptId, itemId, delta) => handleStockUpdate('h1', deptId, itemId, delta)}
          onUpdatePatients={(count) => handlePatientUpdate('h1', count)}
          onUpdateSpecialists={(deptId, delta) => handleSpecialistUpdate('h1', deptId, delta)}
          pendingUpdatesCount={pendingUpdates.length}
        />
      </main>
    </div>
  );
};

export default App;