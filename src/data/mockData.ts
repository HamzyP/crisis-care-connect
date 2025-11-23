import { MedicalCenter, RESOURCE_RATIOS, ResourceLevel, DeliveryTracking, PastDelivery, getResourceStatus, Department } from '@/types/medical';
import { getSyncedHospitalData } from '@/utils/hospitalSync';

export const calculateStatus = (center: Omit<MedicalCenter, 'status'>, dailyUsageRates?: ResourceLevel): MedicalCenter['status'] => {
  // For Indonesian Hospital, use days of supply calculation (matches hospital view)
  if (center.id === '5') {
    let usageRates = dailyUsageRates;
    if (!usageRates) {
      try {
        const stored = localStorage.getItem('indonesian-hospital-sync');
        if (stored) {
          const syncedData = JSON.parse(stored);
          usageRates = syncedData.dailyUsageRates;
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    if (usageRates) {
      // Use days of supply: critical < 2 days, warning < 5 days, good >= 5 days
      const resourceStatuses = Object.entries(center.resources).map(([key, value]) => {
        const dailyUsage = usageRates![key as keyof ResourceLevel];
        if (dailyUsage > 0) {
          const daysSupply = value / dailyUsage;
          if (daysSupply < 2) return 'critical';
          if (daysSupply < 5) return 'warning';
          return 'good';
        }
        return 'good'; // Default if no usage rate
      });
      
      if (resourceStatuses.includes('critical')) return 'critical';
      if (resourceStatuses.includes('warning')) return 'warning';
      return 'good';
    }
  }
  
  // For other hospitals, use percentage-based calculation
  const required = center.maxPatientsCapacity;
  const resourceStatuses = Object.entries(center.resources).map(([key, value]) => {
    const ratio = RESOURCE_RATIOS[key as keyof typeof RESOURCE_RATIOS];
    const needed = required * ratio;
    const percentage = (value / needed) * 100;
    
    if (percentage < 30) return 'critical';
    if (percentage < 70) return 'warning';
    return 'good';
  });
  
  if (resourceStatuses.includes('critical')) return 'critical';
  if (resourceStatuses.includes('warning')) return 'warning';
  return 'good';
};

// Helper function to generate realistic mixed resource levels
// Creates scenarios where hospitals have varying resource statuses
const generateRealisticResources = (
  capacity: number,
  scenario: 'critical' | 'warning' | 'good' | 'mixed'
): ResourceLevel => {
  const ratios = RESOURCE_RATIOS;
  
  // Base required amounts
  const required = {
    insulin: capacity * ratios.insulin,
    antibiotics: capacity * ratios.antibiotics,
    anaesthesia: capacity * ratios.anaesthesia,
    o2Tanks: capacity * ratios.o2Tanks,
    ivFluids: capacity * ratios.ivFluids,
  };
  
  // Generate resources based on scenario
  const getResourceValue = (key: keyof typeof ratios, targetStatus: 'critical' | 'warning' | 'good') => {
    const needed = required[key];
    let percentage: number;
    
    if (targetStatus === 'critical') {
      percentage = 15 + Math.random() * 15; // 15-30%
    } else if (targetStatus === 'warning') {
      percentage = 30 + Math.random() * 40; // 30-70%
    } else {
      percentage = 70 + Math.random() * 30; // 70-100%
    }
    
    return Math.floor(needed * (percentage / 100));
  };
  
  if (scenario === 'critical') {
    // All critical
    return {
      insulin: getResourceValue('insulin', 'critical'),
      antibiotics: getResourceValue('antibiotics', 'critical'),
      anaesthesia: getResourceValue('anaesthesia', 'critical'),
      o2Tanks: getResourceValue('o2Tanks', 'critical'),
      ivFluids: getResourceValue('ivFluids', 'critical'),
    };
  } else if (scenario === 'warning') {
    // All warning
    return {
      insulin: getResourceValue('insulin', 'warning'),
      antibiotics: getResourceValue('antibiotics', 'warning'),
      anaesthesia: getResourceValue('anaesthesia', 'warning'),
      o2Tanks: getResourceValue('o2Tanks', 'warning'),
      ivFluids: getResourceValue('ivFluids', 'warning'),
    };
  } else if (scenario === 'good') {
    // All good
    return {
      insulin: getResourceValue('insulin', 'good'),
      antibiotics: getResourceValue('antibiotics', 'good'),
      anaesthesia: getResourceValue('anaesthesia', 'good'),
      o2Tanks: getResourceValue('o2Tanks', 'good'),
      ivFluids: getResourceValue('ivFluids', 'good'),
    };
  } else {
    // Mixed - realistic scenario where some resources are low, others are fine
    // Typically 1-2 critical, 1-2 warning, rest good
    const statuses: Array<'critical' | 'warning' | 'good'> = [
      'critical',
      'critical',
      'warning',
      'warning',
      'good',
    ];
    // Shuffle for variety
    const shuffled = statuses.sort(() => Math.random() - 0.5);
    
    return {
      insulin: getResourceValue('insulin', shuffled[0]),
      antibiotics: getResourceValue('antibiotics', shuffled[1]),
      anaesthesia: getResourceValue('anaesthesia', shuffled[2]),
      o2Tanks: getResourceValue('o2Tanks', shuffled[3]),
      ivFluids: getResourceValue('ivFluids', shuffled[4]),
    };
  }
};

// Helper to create departments with staff
const createDepartment = (id: string, name: string, specialistTitle: string, specialistCount: number): Department => ({
  id,
  name,
  specialistTitle,
  specialistCount,
});

export const rawCenters: Omit<MedicalCenter, 'status'>[] = [
  {
    id: '1',
    name: 'Al-Shifa Hospital',
    location: { lat: 31.5017, lng: 34.4668 },
    maxPatientsCapacity: 150,
    currentPatients: 142,
    resources: generateRealisticResources(150, 'mixed'), // Mixed - some good, some critical
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 12),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 10),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 8),
    ],
  },
  {
    id: '2',
    name: 'Gaza European Hospital',
    location: { lat: 31.3889, lng: 34.3686 },
    maxPatientsCapacity: 120,
    currentPatients: 98,
    resources: generateRealisticResources(120, 'mixed'), // Mixed - insulin critical, others vary
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 10),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 8),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 6),
    ],
  },
  {
    id: '3',
    name: 'Nasser Medical Complex',
    location: { lat: 31.3547, lng: 34.2969 },
    maxPatientsCapacity: 200,
    currentPatients: 187,
    resources: generateRealisticResources(200, 'good'), // Well-stocked overall
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 18),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 15),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 12),
    ],
  },
  {
    id: '4',
    name: 'Al-Quds Hospital',
    location: { lat: 31.5231, lng: 34.4415 },
    maxPatientsCapacity: 100,
    currentPatients: 95,
    resources: generateRealisticResources(100, 'mixed'), // Mixed scenario
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 8),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 6),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 5),
    ],
  },
  {
    id: '5',
    name: 'Indonesian Hospital',
    location: { lat: 31.4273, lng: 34.3815 },
    maxPatientsCapacity: 130,
    currentPatients: 115,
    resources: generateRealisticResources(130, 'warning'), // Mostly warning level
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 15),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 10),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 6),
    ],
  },
  {
    id: '6',
    name: 'Kamal Adwan Hospital',
    location: { lat: 31.5444, lng: 34.5103 },
    maxPatientsCapacity: 90,
    currentPatients: 78,
    resources: generateRealisticResources(90, 'mixed'), // Mixed - some critical items
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 7),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 5),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 4),
    ],
  },
  {
    id: '7',
    name: 'Al-Awda Hospital',
    location: { lat: 31.4658, lng: 34.4221 },
    maxPatientsCapacity: 110,
    currentPatients: 102,
    resources: generateRealisticResources(110, 'good'), // Well-stocked
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 9),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 7),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 5),
    ],
  },
  {
    id: '8',
    name: 'Shuhada Al-Aqsa Hospital',
    location: { lat: 31.4186, lng: 34.3672 },
    maxPatientsCapacity: 140,
    currentPatients: 125,
    resources: generateRealisticResources(140, 'mixed'), // Mixed scenario
    departments: [
      createDepartment('d1', 'Trauma & Emergency', 'Trauma Surgeons', 11),
      createDepartment('d2', 'Critical Care Unit', 'ER Doctors', 9),
      createDepartment('d3', 'Pediatrics', 'Pediatricians', 7),
    ],
  },
];

// Helper function to merge synced data for Indonesian Hospital
// NOTE: This function is only used by the old mockMedicalCenters export
// The hook useMedicalCenters() has its own mergeSyncedData that properly handles Indonesian Hospital
const mergeSyncedData = (center: Omit<MedicalCenter, 'status'>, index: number): MedicalCenter => {
  // Check if this is Indonesian Hospital (id: '5')
  if (center.id === '5') {
    const syncedData = getSyncedHospitalData();
    if (syncedData) {
      // Merge synced data - ONLY use synced data, never mock data
      return {
        ...center,
        resources: syncedData.resources,
        currentPatients: syncedData.currentPatients,
        maxPatientsCapacity: syncedData.maxPatientsCapacity,
        departments: syncedData.departments,
        status: calculateStatus({
          ...center,
          resources: syncedData.resources,
          maxPatientsCapacity: syncedData.maxPatientsCapacity,
        }),
        lastUpdated: new Date(syncedData.lastUpdated),
      };
    }
    // If no synced data, return a placeholder that will be filtered out
    // This ensures Indonesian Hospital only appears with synced data
    return {
      ...center,
      resources: { insulin: 0, antibiotics: 0, anaesthesia: 0, o2Tanks: 0, ivFluids: 0 },
      currentPatients: 0,
      maxPatientsCapacity: 0,
      status: 'critical' as const,
      lastUpdated: new Date(),
    };
  }
  
  // Generate realistic last updated times (varying from 5 minutes to 4 hours ago)
  const now = new Date();
  const minutesAgo = 5 + (index * 23) % 235; // Varies between 5-240 minutes
  const lastUpdated = new Date(now.getTime() - minutesAgo * 60 * 1000);
  
  return {
    ...center,
    status: calculateStatus(center),
    lastUpdated,
  };
};

export const mockMedicalCenters: MedicalCenter[] = rawCenters.map((center, index) => 
  mergeSyncedData(center, index)
);

export const ministryWarehouse = {
  insulin: 4873,
  antibiotics: 7624,
  anaesthesia: 3127,
  o2Tanks: 8439,
  ivFluids: 11856,
};

// Calculate supply duration (days remaining) based on actual resource levels and usage rates
// For Indonesian Hospital, uses synced daily usage rates; for others, calculates from ratios
export const getSupplyDuration = (center: MedicalCenter, dailyUsageRates?: ResourceLevel): ResourceLevel => {
  const calculateDays = (key: keyof typeof RESOURCE_RATIOS, currentValue: number, dailyUsage: number): number => {
    if (dailyUsage <= 0) {
      // Fallback calculation if no usage rate available
      const ratio = RESOURCE_RATIOS[key];
      const needed = center.maxPatientsCapacity * ratio;
      const percentage = (currentValue / needed) * 100;
      // Simple deterministic calculation: 30 days at 100%
      return Math.max(0, Math.round((percentage / 100) * 30));
    }
    
    // Calculate days based on actual usage rate: days = quantity / dailyUsage
    const days = currentValue / dailyUsage;
    return Math.max(0, Math.round(days * 10) / 10); // Round to 1 decimal place
  };
  
  // For Indonesian Hospital, use synced daily usage rates
  if (center.id === '5' && dailyUsageRates) {
    return {
      insulin: calculateDays('insulin', center.resources.insulin, dailyUsageRates.insulin),
      antibiotics: calculateDays('antibiotics', center.resources.antibiotics, dailyUsageRates.antibiotics),
      anaesthesia: calculateDays('anaesthesia', center.resources.anaesthesia, dailyUsageRates.anaesthesia),
      o2Tanks: calculateDays('o2Tanks', center.resources.o2Tanks, dailyUsageRates.o2Tanks),
      ivFluids: calculateDays('ivFluids', center.resources.ivFluids, dailyUsageRates.ivFluids),
    };
  }
  
  // For other hospitals, use fallback calculation
  const required = center.maxPatientsCapacity;
  const fallbackDailyUsage = required * 0.033; // Generic fallback
  
  return {
    insulin: calculateDays('insulin', center.resources.insulin, fallbackDailyUsage),
    antibiotics: calculateDays('antibiotics', center.resources.antibiotics, fallbackDailyUsage),
    anaesthesia: calculateDays('anaesthesia', center.resources.anaesthesia, fallbackDailyUsage),
    o2Tanks: calculateDays('o2Tanks', center.resources.o2Tanks, fallbackDailyUsage),
    ivFluids: calculateDays('ivFluids', center.resources.ivFluids, fallbackDailyUsage),
  };
};

// Mock data for active deliveries (in transit)
// Warning and critical hospitals should have deliveries
export const getActiveDeliveries = (hospital: MedicalCenter): DeliveryTracking | null => {
  // Warning and critical hospitals should have deliveries in transit
  // Good hospitals might have some too, but less likely
  const hasDelivery = 
    hospital.status === 'critical' || 
    hospital.status === 'warning' ||
    (hospital.status === 'good' && parseInt(hospital.id) % 4 === 0);
  
  if (!hasDelivery) return null;

  const now = new Date();
  const hospitalId = hospital.id;
  
  // Critical hospitals get faster delivery (1-2 days), warning get 2-4 days
  const daysUntilArrival = hospital.status === 'critical' 
    ? 1 + (parseInt(hospitalId) % 2)
    : 2 + (parseInt(hospitalId) % 3);
  
  const estimatedArrival = new Date(now);
  estimatedArrival.setDate(estimatedArrival.getDate() + daysUntilArrival);
  
  const dispatchedDate = new Date(now);
  dispatchedDate.setDate(dispatchedDate.getDate() - (parseInt(hospitalId) % 2));
  
  // Status depends on urgency - critical hospitals more likely to be "out for delivery"
  const statuses: DeliveryTracking['status'][] = 
    hospital.status === 'critical' 
      ? ['out_for_delivery', 'in_transit']
      : ['preparing', 'in_transit', 'out_for_delivery'];
  const status = statuses[parseInt(hospitalId) % statuses.length];
  
  const locations = [
    'Central Warehouse - Gaza City',
    'Distribution Center - Khan Yunis',
    'En route to hospital',
    'Near hospital - Final delivery',
  ];

  // Calculate resupply amounts - prioritize critical resources, bring to adequate levels
  const required = hospital.maxPatientsCapacity;
  const resourceStatuses = getResourceStatus(hospital);
  
  const calculateResupply = (key: keyof typeof RESOURCE_RATIOS) => {
    const ratio = RESOURCE_RATIOS[key];
    const needed = required * ratio;
    const current = hospital.resources[key];
    const percentage = (current / needed) * 100;
    
    // Prioritize based on status:
    // Critical: Bring to 80% (high priority)
    // Warning: Bring to 70% (medium priority)
    // Good: Bring to 75% (maintain good levels, but less urgent)
    let targetPercentage = 75;
    if (resourceStatuses.critical.includes(key)) {
      targetPercentage = 80; // Critical resources get more
    } else if (resourceStatuses.warning.includes(key)) {
      targetPercentage = 70; // Warning resources get enough to be safe
    }
    
    const target = needed * (targetPercentage / 100);
    const amount = Math.max(0, Math.ceil(target - current));
    
    // Don't send delivery if already well-stocked (good resources)
    if (resourceStatuses.good.includes(key) && percentage >= 75) {
      return 0; // Good resources don't need delivery
    }
    
    return amount;
  };

  return {
    id: `delivery-${hospitalId}-${Date.now()}`,
    hospitalId,
    status,
    estimatedArrival,
    currentLocation: status === 'out_for_delivery' ? locations[3] : locations[parseInt(hospitalId) % 3],
    trackingNumber: `MOH-${hospitalId}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    resources: {
      insulin: calculateResupply('insulin'),
      antibiotics: calculateResupply('antibiotics'),
      anaesthesia: calculateResupply('anaesthesia'),
      o2Tanks: calculateResupply('o2Tanks'),
      ivFluids: calculateResupply('ivFluids'),
    },
    dispatchedDate,
  };
};

// Mock data for past deliveries
export const getPastDeliveries = (hospitalId: string): PastDelivery[] => {
  const deliveries: PastDelivery[] = [];
  const now = new Date();
  
  // Generate 5-8 past deliveries per hospital
  const count = 5 + (parseInt(hospitalId) % 4);
  
  for (let i = 0; i < count; i++) {
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() - (i * 7 + Math.floor(Math.random() * 3)));
    
    // Mix of automatic and manual orders (roughly 60% automatic, 40% manual)
    const orderType: 'automatic' | 'manual' = Math.random() > 0.4 ? 'automatic' : 'manual';
    
    deliveries.push({
      id: `past-${hospitalId}-${i}`,
      hospitalId,
      deliveryDate,
      resources: {
        insulin: 100 + Math.floor(Math.random() * 200),
        antibiotics: 150 + Math.floor(Math.random() * 250),
        anaesthesia: 60 + Math.floor(Math.random() * 120),
        o2Tanks: 200 + Math.floor(Math.random() * 300),
        ivFluids: 300 + Math.floor(Math.random() * 400),
      },
      trackingNumber: `MOH-${hospitalId}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      status: Math.random() > 0.1 ? 'delivered' : 'cancelled',
      orderType,
    });
  }
  
  // Sort by date, most recent first
  return deliveries.sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());
};