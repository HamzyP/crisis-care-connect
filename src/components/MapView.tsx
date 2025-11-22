import { useNavigate } from 'react-router-dom';
import { MedicalCenter, RESOURCE_NAMES } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapViewProps {
  centers: MedicalCenter[];
}

const statusColors = {
  critical: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
  good: 'hsl(var(--success))',
};

const MapView = ({ centers }: MapViewProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border bg-muted p-8">
      <div className="relative w-full h-full bg-card rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full overflow-auto">
          {centers.map((center) => (
            <Card
              key={center.id}
              className="h-fit cursor-pointer hover:shadow-lg transition-shadow"
              style={{ borderLeft: `4px solid ${statusColors[center.status]}` }}
              onClick={() => navigate(`/hospital/${center.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColors[center.status] }}
                  />
                  <CardTitle className="text-sm">{center.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">
                    {center.currentPatients}/{center.maxPatientsCapacity}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-semibold mb-1 text-muted-foreground">Resources:</p>
                  {Object.entries(center.resources).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}:
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold mb-2">Status Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.critical }} />
              <span>Critical - Need Supply</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.warning }} />
              <span>Warning - In Transit</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.good }} />
              <span>Good - Adequate Stock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
