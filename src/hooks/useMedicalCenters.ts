import { useState, useEffect } from 'react';
import { MedicalCenter, ResourceLevel } from '@/types/medical';
import { rawCenters, calculateStatus } from '@/data/mockData';
import { getSyncedHospitalData, subscribeToHospitalUpdates } from '@/utils/hospitalSync';

// Store daily usage rates for Indonesian Hospital
let indonesianHospitalUsageRates: ResourceLevel | undefined = undefined;

// Helper function to merge synced data for Indonesian Hospital
// IMPORTANT: Indonesian Hospital (id: '5') ONLY uses synced data, NEVER mock data
const mergeSyncedData = (center: Omit<MedicalCenter, 'status'>, index: number): MedicalCenter | null => {
  // Check if this is Indonesian Hospital (id: '5')
  if (center.id === '5') {
    const syncedData = getSyncedHospitalData();
    if (syncedData) {
      // Store usage rates for days calculation
      indonesianHospitalUsageRates = syncedData.dailyUsageRates;
      
      console.log('[Ministry View] Initial merge - Using synced data ONLY, IV Fluids:', syncedData.resources.ivFluids);
      
      // Create hospital ONLY from synced data - ignore all mock data
      return {
        id: center.id,
        name: center.name,
        location: center.location,
        resources: syncedData.resources, // ONLY synced resources
        currentPatients: syncedData.currentPatients, // ONLY synced patients
        maxPatientsCapacity: syncedData.maxPatientsCapacity, // ONLY synced capacity (600)
        departments: syncedData.departments, // ONLY synced departments
        status: calculateStatus({
          id: center.id,
          name: center.name,
          location: center.location,
          resources: syncedData.resources,
          maxPatientsCapacity: syncedData.maxPatientsCapacity,
          currentPatients: syncedData.currentPatients,
          departments: syncedData.departments,
        }, syncedData.dailyUsageRates),
        lastUpdated: new Date(syncedData.lastUpdated),
      };
    } else {
      // For Indonesian Hospital, if no synced data exists, return null to exclude it
      // This ensures it ONLY appears when synced data is available from hospital view
      console.log('[Ministry View] Initial merge - No synced data found for Indonesian Hospital, excluding from list');
      return null;
    }
  }
  
  // For other hospitals, use mock data as normal
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

/**
 * Hook to get medical centers with reactive updates for Indonesian Hospital
 * Returns centers and usage rates for Indonesian Hospital
 */
export function useMedicalCenters(): { centers: MedicalCenter[]; indonesianHospitalUsageRates?: ResourceLevel } {
  const [centers, setCenters] = useState<MedicalCenter[]>(() => 
    rawCenters
      .map((center, index) => mergeSyncedData(center, index))
      .filter((center): center is MedicalCenter => center !== null) // Filter out null (Indonesian Hospital without synced data)
  );

  useEffect(() => {
    // Check for existing synced data on mount and ensure Indonesian Hospital is created/updated
    const existingSyncedData = getSyncedHospitalData();
    if (existingSyncedData) {
      console.log('[Ministry View] Found existing synced data on mount - IV Fluids:', existingSyncedData.resources.ivFluids);
      indonesianHospitalUsageRates = existingSyncedData.dailyUsageRates;
      
      // Find Indonesian Hospital in rawCenters to get base info (id, name, location)
      const indonesianBase = rawCenters.find(c => c.id === '5');
      if (indonesianBase) {
        setCenters(prevCenters => {
          // Check if Indonesian Hospital already exists in the list
          const hasIndonesian = prevCenters.some(c => c.id === '5');
          
          if (hasIndonesian) {
            // Update existing Indonesian Hospital with synced data ONLY
            return prevCenters.map(center => {
              if (center.id === '5') {
                return {
                  id: center.id,
                  name: center.name,
                  location: center.location,
                  resources: existingSyncedData.resources, // ONLY synced
                  currentPatients: existingSyncedData.currentPatients, // ONLY synced
                  maxPatientsCapacity: existingSyncedData.maxPatientsCapacity, // ONLY synced
                  departments: existingSyncedData.departments, // ONLY synced
                  status: calculateStatus({
                    id: center.id,
                    name: center.name,
                    location: center.location,
                    resources: existingSyncedData.resources,
                    maxPatientsCapacity: existingSyncedData.maxPatientsCapacity,
                    currentPatients: existingSyncedData.currentPatients,
                    departments: existingSyncedData.departments,
                  }, existingSyncedData.dailyUsageRates),
                  lastUpdated: new Date(existingSyncedData.lastUpdated),
                };
              }
              return center;
            });
          } else {
            // Add Indonesian Hospital if it doesn't exist (shouldn't happen, but just in case)
            const indonesianHospital: MedicalCenter = {
              id: indonesianBase.id,
              name: indonesianBase.name,
              location: indonesianBase.location,
              resources: existingSyncedData.resources,
              currentPatients: existingSyncedData.currentPatients,
              maxPatientsCapacity: existingSyncedData.maxPatientsCapacity,
              departments: existingSyncedData.departments,
              status: calculateStatus({
                ...indonesianBase,
                resources: existingSyncedData.resources,
                maxPatientsCapacity: existingSyncedData.maxPatientsCapacity,
                currentPatients: existingSyncedData.currentPatients,
                departments: existingSyncedData.departments,
              }, existingSyncedData.dailyUsageRates),
              lastUpdated: new Date(existingSyncedData.lastUpdated),
            };
            return [...prevCenters, indonesianHospital];
          }
        });
      }
    }
    
    // Subscribe to hospital updates
    const unsubscribe = subscribeToHospitalUpdates((syncedData) => {
      console.log('[Ministry View] Received hospital update - IV Fluids:', syncedData.resources.ivFluids);
      // Store usage rates for days calculation
      indonesianHospitalUsageRates = syncedData.dailyUsageRates;
      
      // Update centers when Indonesian Hospital data changes
      // Find base info for Indonesian Hospital
      const indonesianBase = rawCenters.find(c => c.id === '5');
      if (!indonesianBase) return;
      
      setCenters(prevCenters => {
        const hasIndonesian = prevCenters.some(c => c.id === '5');
        
        // Create/update Indonesian Hospital using ONLY synced data
        const indonesianHospital: MedicalCenter = {
          id: indonesianBase.id,
          name: indonesianBase.name,
          location: indonesianBase.location,
          resources: syncedData.resources, // ONLY synced data
          currentPatients: syncedData.currentPatients, // ONLY synced data
          maxPatientsCapacity: syncedData.maxPatientsCapacity, // ONLY synced data
          departments: syncedData.departments, // ONLY synced data
          status: calculateStatus({
            ...indonesianBase,
            resources: syncedData.resources,
            maxPatientsCapacity: syncedData.maxPatientsCapacity,
            currentPatients: syncedData.currentPatients,
            departments: syncedData.departments,
          }, syncedData.dailyUsageRates),
          lastUpdated: new Date(syncedData.lastUpdated),
        };
        
        // Debug: Calculate IV Fluids days of supply (matching hospital view logic)
        const ivFluidsUsage = syncedData.dailyUsageRates.ivFluids;
        const daysSupply = ivFluidsUsage > 0 ? syncedData.resources.ivFluids / ivFluidsUsage : 0;
        const ivFluidsStatus = daysSupply < 2 ? 'critical' : daysSupply < 5 ? 'warning' : 'good';
        console.log('[Ministry View] IV Fluids status calc (days of supply):', {
          quantity: syncedData.resources.ivFluids,
          dailyUsageRate: ivFluidsUsage,
          daysSupply: daysSupply.toFixed(2) + ' days',
          status: ivFluidsStatus,
          overallStatus: indonesianHospital.status,
        });
        
        if (hasIndonesian) {
          // Replace existing Indonesian Hospital
          return prevCenters.map(center => 
            center.id === '5' ? indonesianHospital : center
          );
        } else {
          // Add Indonesian Hospital if it doesn't exist
          return [...prevCenters, indonesianHospital];
        }
      });
    });

    return unsubscribe;
  }, []);
  
  return { centers, indonesianHospitalUsageRates };
}

