import { MedicalCenter, RESOURCE_RATIOS } from '@/types/medical';

const calculateStatus = (center: Omit<MedicalCenter, 'status'>): MedicalCenter['status'] => {
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

const rawCenters: Omit<MedicalCenter, 'status'>[] = [
  {
    id: '1',
    name: 'Al-Shifa Hospital',
    location: { lat: 31.5017, lng: 34.4668 },
    maxPatientsCapacity: 150,
    currentPatients: 142,
    resources: {
      insulin: 180,
      antibiotics: 250,
      anaesthesia: 90,
      o2Tanks: 280,
      ivFluids: 420,
    },
  },
  {
    id: '2',
    name: 'Gaza European Hospital',
    location: { lat: 31.3889, lng: 34.3686 },
    maxPatientsCapacity: 120,
    currentPatients: 98,
    resources: {
      insulin: 40,
      antibiotics: 80,
      anaesthesia: 30,
      o2Tanks: 85,
      ivFluids: 150,
    },
  },
  {
    id: '3',
    name: 'Nasser Medical Complex',
    location: { lat: 31.3547, lng: 34.2969 },
    maxPatientsCapacity: 200,
    currentPatients: 187,
    resources: {
      insulin: 320,
      antibiotics: 420,
      anaesthesia: 165,
      o2Tanks: 455,
      ivFluids: 615,
    },
  },
  {
    id: '4',
    name: 'Al-Quds Hospital',
    location: { lat: 31.5231, lng: 34.4415 },
    maxPatientsCapacity: 100,
    currentPatients: 95,
    resources: {
      insulin: 60,
      antibiotics: 95,
      anaesthesia: 45,
      o2Tanks: 120,
      ivFluids: 180,
    },
  },
  {
    id: '5',
    name: 'Indonesian Hospital',
    location: { lat: 31.4273, lng: 34.3815 },
    maxPatientsCapacity: 130,
    currentPatients: 115,
    resources: {
      insulin: 210,
      antibiotics: 275,
      anaesthesia: 110,
      o2Tanks: 310,
      ivFluids: 425,
    },
  },
  {
    id: '6',
    name: 'Kamal Adwan Hospital',
    location: { lat: 31.5444, lng: 34.5103 },
    maxPatientsCapacity: 90,
    currentPatients: 78,
    resources: {
      insulin: 25,
      antibiotics: 45,
      anaesthesia: 20,
      o2Tanks: 65,
      ivFluids: 95,
    },
  },
  {
    id: '7',
    name: 'Al-Awda Hospital',
    location: { lat: 31.4658, lng: 34.4221 },
    maxPatientsCapacity: 110,
    currentPatients: 102,
    resources: {
      insulin: 175,
      antibiotics: 230,
      anaesthesia: 92,
      o2Tanks: 255,
      ivFluids: 350,
    },
  },
  {
    id: '8',
    name: 'Shuhada Al-Aqsa Hospital',
    location: { lat: 31.4186, lng: 34.3672 },
    maxPatientsCapacity: 140,
    currentPatients: 125,
    resources: {
      insulin: 90,
      antibiotics: 150,
      anaesthesia: 65,
      o2Tanks: 180,
      ivFluids: 250,
    },
  },
];

export const mockMedicalCenters: MedicalCenter[] = rawCenters.map(center => ({
  ...center,
  status: calculateStatus(center),
}));

export const ministryWarehouse = {
  insulin: 5000,
  antibiotics: 7500,
  anaesthesia: 3000,
  o2Tanks: 8500,
  ivFluids: 12000,
};
