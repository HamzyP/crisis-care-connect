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
