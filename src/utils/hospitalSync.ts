// Utility to sync Indonesian Hospital data between Hospital View and Ministry View

import { ItemType } from '../../Hospital_view/UCLXImperialXMMU/types';
import { ResourceLevel } from '@/types/medical';

// Map Hospital View ItemType to Ministry View resource keys
// Note: Analgesics are NOT included - only sync resources that exist in ministry view
const ITEM_TYPE_TO_RESOURCE: Partial<Record<ItemType, keyof ResourceLevel>> = {
  [ItemType.INSULIN]: 'insulin',
  [ItemType.ANTIBIOTICS]: 'antibiotics',
  [ItemType.ANESTHESIA]: 'anaesthesia',
  [ItemType.O2]: 'o2Tanks',
  [ItemType.FLUIDS]: 'ivFluids',
  // Analgesics are NOT synced - they don't exist in ministry view
};

const STORAGE_KEY = 'indonesian-hospital-sync';
const STORAGE_EVENT_KEY = 'indonesian-hospital-updated';

export interface SyncedHospitalData {
  resources: ResourceLevel;
  dailyUsageRates: ResourceLevel; // Daily usage rates for each resource
  currentPatients: number;
  maxPatientsCapacity: number;
  departments: Array<{
    id: string;
    name: string;
    specialistTitle: string;
    specialistCount: number;
  }>;
  lastUpdated: number; // timestamp
}

/**
 * Aggregate hospital view inventory items into ministry view resources
 * Also aggregates daily usage rates
 */
export function aggregateHospitalResources(
  departments: Array<{
    inventory: Array<{
      name: ItemType;
      quantity: number;
      dailyUsageRate: number;
    }>;
  }>
): { resources: ResourceLevel; dailyUsageRates: ResourceLevel } {
  const aggregatedResources: Partial<ResourceLevel> = {
    insulin: 0,
    antibiotics: 0,
    anaesthesia: 0,
    o2Tanks: 0,
    ivFluids: 0,
  };

  const aggregatedUsageRates: Partial<ResourceLevel> = {
    insulin: 0,
    antibiotics: 0,
    anaesthesia: 0,
    o2Tanks: 0,
    ivFluids: 0,
  };

  departments.forEach((dept) => {
    dept.inventory.forEach((item) => {
      const resourceKey = ITEM_TYPE_TO_RESOURCE[item.name];
      // Only aggregate if resourceKey is not null and exists in aggregatedResources
      if (resourceKey && aggregatedResources[resourceKey] !== undefined) {
        const prevQty = aggregatedResources[resourceKey] || 0;
        const prevUsage = aggregatedUsageRates[resourceKey] || 0;
        aggregatedResources[resourceKey] = prevQty + item.quantity;
        aggregatedUsageRates[resourceKey] = prevUsage + item.dailyUsageRate;
        
        // Debug logging for IV Fluids
        if (item.name === ItemType.FLUIDS || item.name === 'IV Fluids') {
          console.log(`[Aggregation] Found IV Fluids: ${item.quantity} (total so far: ${aggregatedResources[resourceKey]})`);
        }
      }
      // Skip analgesics - they are not synced to ministry view
    });
  });
  
  console.log('[Aggregation] Final aggregated resources:', aggregatedResources);
  console.log('[Aggregation] Final aggregated usage rates:', aggregatedUsageRates);

  return {
    resources: aggregatedResources as ResourceLevel,
    dailyUsageRates: aggregatedUsageRates as ResourceLevel,
  };
}

/**
 * Sync hospital data to localStorage and dispatch event
 */
export function syncHospitalDataToMinistry(data: {
  resources: ResourceLevel;
  dailyUsageRates: ResourceLevel;
  currentPatients: number;
  maxPatientsCapacity: number;
  departments: Array<{
    id: string;
    name: string;
    specialistTitle: string;
    specialistCount: number;
  }>;
}): void {
  const syncedData: SyncedHospitalData = {
    ...data,
    lastUpdated: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData));
  
  // Dispatch custom event for real-time updates
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT_KEY));
  
  // Debug log with expanded resources - focus on IV Fluids for demo
  console.log('[Hospital Sync] Data synced to localStorage:', {
    resources: {
      ...syncedData.resources,
      ivFluids: syncedData.resources.ivFluids, // Explicitly log IV Fluids for demo
    },
    dailyUsageRates: {
      ...syncedData.dailyUsageRates,
      ivFluids: syncedData.dailyUsageRates.ivFluids, // Explicitly log IV Fluids usage rate
    },
    timestamp: syncedData.lastUpdated,
  });
}

/**
 * Get synced hospital data from localStorage
 */
export function getSyncedHospitalData(): SyncedHospitalData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as SyncedHospitalData;
  } catch {
    return null;
  }
}

/**
 * Subscribe to hospital data updates
 */
export function subscribeToHospitalUpdates(
  callback: (data: SyncedHospitalData) => void
): () => void {
  let lastTimestamp: number | null = null;
  
  const handler = () => {
    const data = getSyncedHospitalData();
    if (data) {
      // Only call callback if data has actually changed (by timestamp)
      if (lastTimestamp === null || data.lastUpdated > lastTimestamp) {
        lastTimestamp = data.lastUpdated;
        callback(data);
      }
    }
  };

  // Listen to custom events (for same-tab updates)
  window.addEventListener(STORAGE_EVENT_KEY, handler);
  
  // Also listen to storage events (for cross-tab/window updates)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue) as SyncedHospitalData;
        if (lastTimestamp === null || data.lastUpdated > lastTimestamp) {
          lastTimestamp = data.lastUpdated;
          callback(data);
        }
      } catch {
        // Ignore parse errors
      }
    }
  });

  // Polling fallback for cross-origin scenarios (check every 2 seconds to reduce excessive updates)
  const pollInterval = setInterval(() => {
    const data = getSyncedHospitalData();
    if (data && (lastTimestamp === null || data.lastUpdated > lastTimestamp)) {
      lastTimestamp = data.lastUpdated;
      callback(data);
    }
  }, 2000);

  // Return unsubscribe function
  return () => {
    window.removeEventListener(STORAGE_EVENT_KEY, handler);
    clearInterval(pollInterval);
  };
}

