import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { MedicalCenter, RESOURCE_NAMES, getResourceStatus } from '@/types/medical';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface HospitalMapProps {
  centers: MedicalCenter[];
}

// Fix for default marker icons in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom colored markers
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="8" fill="white" opacity="0.3"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Get status colors - we'll use a function to get actual CSS values
const getStatusColor = (status: 'critical' | 'warning' | 'good'): string => {
  // Use standard colors that work with both light and dark themes
  const colors = {
    critical: '#ef4444', // red-500
    warning: '#eab308', // yellow-500
    good: '#22c55e', // green-500
  };
  return colors[status];
};

// Component to fit map bounds to show all hospitals
const MapBounds = ({ centers }: { centers: MedicalCenter[] }) => {
  const map = useMap();

  useEffect(() => {
    if (centers.length > 0) {
      const bounds = centers.map(center => [center.location.lat, center.location.lng] as LatLngExpression);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [centers, map]);

  return null;
};

// Format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const HospitalMap = ({ centers }: HospitalMapProps) => {
  const navigate = useNavigate();
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);

  // Calculate center point for initial map view (Gaza region)
  const centerLat = centers.reduce((sum, c) => sum + c.location.lat, 0) / centers.length;
  const centerLng = centers.reduce((sum, c) => sum + c.location.lng, 0) / centers.length;

  const handleMarkerClick = (centerId: string) => {
    // Toggle: if same center is clicked, close it; otherwise open new one
    setSelectedCenter(selectedCenter === centerId ? null : centerId);
  };

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds centers={centers} />
        {centers.map((center) => {
          const color = getStatusColor(center.status);
          const customIcon = createCustomIcon(color);
          const isSelected = selectedCenter === center.id;

          return (
            <Marker
              key={center.id}
              position={[center.location.lat, center.location.lng]}
              icon={customIcon}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(center.id);
                },
              }}
            >
              <Tooltip 
                permanent={isSelected} 
                direction="top" 
                offset={[0, -40]}
                interactive={false}
              >
                <div className="text-xs font-medium">{center.name}</div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Click Card - shows detailed info on marker click */}
      {selectedCenter && (() => {
        const center = centers.find(c => c.id === selectedCenter);
        if (!center) return null;
        const color = getStatusColor(center.status);
        
        return (
          <div className="absolute top-4 right-4 z-[1000] max-w-sm">
            <Card className="shadow-lg border-2" style={{ borderColor: color }}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{center.name}</h3>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs capitalize font-medium">{center.status}</span>
                      <button
                        onClick={() => setSelectedCenter(null)}
                        className="ml-2 p-1 hover:bg-muted rounded-sm transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Capacity:</span>
                      <span className="font-medium">
                        {center.currentPatients}/{center.maxPatientsCapacity} patients
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold mb-1 text-muted-foreground">Resources:</p>
                      <div className="space-y-1">
                        {(() => {
                          const resourceStatuses = getResourceStatus(center);
                          return Object.entries(center.resources).map(([key, value]) => {
                            // Color-code based on resource status (same as grid view)
                            const isCritical = resourceStatuses.critical.includes(key);
                            const isWarning = resourceStatuses.warning.includes(key);
                            const isGood = resourceStatuses.good.includes(key);
                            
                            let textColor = 'text-muted-foreground';
                            let valueColor = 'font-medium';
                            
                            if (isCritical) {
                              textColor = 'text-destructive font-semibold';
                              valueColor = 'font-bold text-destructive';
                            } else if (isWarning) {
                              textColor = 'text-warning font-semibold';
                              valueColor = 'font-bold text-warning';
                            } else if (isGood) {
                              textColor = 'text-success font-semibold';
                              valueColor = 'font-bold text-success';
                            }
                            
                            return (
                              <div key={key} className="flex justify-between text-xs">
                                <span className={textColor}>
                                  {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}:
                                </span>
                                <span className={valueColor}>{value}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {formatTimeAgo(center.lastUpdated)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/hospital/${center.id}`)}
                      className="mt-3 w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors"
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

export default HospitalMap;

