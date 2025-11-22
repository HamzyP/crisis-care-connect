import { MedicalCenter, RESOURCE_NAMES } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ministryWarehouse } from '@/data/mockData';

interface DashboardViewProps {
  centers: MedicalCenter[];
}

const DashboardView = ({ centers }: DashboardViewProps) => {
  const criticalCount = centers.filter(c => c.status === 'critical').length;
  const warningCount = centers.filter(c => c.status === 'warning').length;
  const goodCount = centers.filter(c => c.status === 'good').length;

  const totalResources = centers.reduce(
    (acc, center) => {
      Object.entries(center.resources).forEach(([key, value]) => {
        acc[key as keyof typeof acc] += value;
      });
      return acc;
    },
    { insulin: 0, antibiotics: 0, anaesthesia: 0, o2Tanks: 0, ivFluids: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Hospitals need immediate supply</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warning Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{warningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Stock in transit</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Good Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{goodCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Adequate stock levels</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Resources Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(totalResources).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}
                  </span>
                  <span className="text-lg font-semibold">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ministry Warehouse Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ministryWarehouse).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}
                  </span>
                  <span className="text-lg font-semibold">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
