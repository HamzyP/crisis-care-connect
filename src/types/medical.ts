export type ResourceStatus = 'critical' | 'warning' | 'good';

export interface ResourceLevel {
  insulin: number;
  antibiotics: number;
  anaesthesia: number;
  o2Tanks: number;
  ivFluids: number;
}

export interface MedicalCenter {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  maxPatientsCapacity: number;
  currentPatients: number;
  resources: ResourceLevel;
  status: ResourceStatus;
  lastUpdated: Date; // Timestamp of when data was last updated from hospital
}

export const RESOURCE_RATIOS = {
  insulin: 1.5,
  antibiotics: 2.0,
  anaesthesia: 0.8,
  o2Tanks: 2.2,
  ivFluids: 3.0,
};

export const RESOURCE_NAMES = {
  insulin: 'Insulin',
  antibiotics: 'Antibiotics',
  anaesthesia: 'Anaesthesia',
  o2Tanks: 'O2 Tanks',
  ivFluids: 'IV Fluids',
};

// Utility function to get resource status for each resource
export const getResourceStatus = (center: MedicalCenter): {
  critical: string[];
  warning: string[];
  good: string[];
} => {
  const critical: string[] = [];
  const warning: string[] = [];
  const good: string[] = [];
  const required = center.maxPatientsCapacity;
  
  Object.entries(center.resources).forEach(([key, value]) => {
    const ratio = RESOURCE_RATIOS[key as keyof typeof RESOURCE_RATIOS];
    const needed = required * ratio;
    const percentage = (value / needed) * 100;
    
    if (percentage < 30) {
      critical.push(key);
    } else if (percentage < 70) {
      warning.push(key);
    } else {
      good.push(key);
    }
  });
  
  return { critical, warning, good };
};

// Utility function to get critical resources for a hospital (backward compatibility)
export const getCriticalResources = (center: MedicalCenter): string[] => {
  return getResourceStatus(center).critical;
};

export type DeliveryStatus = 'preparing' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface DeliveryTracking {
  id: string;
  hospitalId: string;
  status: DeliveryStatus;
  estimatedArrival: Date;
  currentLocation?: string;
  trackingNumber: string;
  resources: ResourceLevel;
  dispatchedDate: Date;
  deliveredDate?: Date;
}

export type OrderType = 'automatic' | 'manual';

export interface PastDelivery {
  id: string;
  hospitalId: string;
  deliveryDate: Date;
  resources: ResourceLevel;
  trackingNumber: string;
  status: 'delivered' | 'cancelled';
  orderType: OrderType;
}