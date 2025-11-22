import { useParams, useNavigate } from 'react-router-dom';
import { mockMedicalCenters, getSupplyDuration, ministryWarehouse } from '@/data/mockData';
import { RESOURCE_NAMES } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Package, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { Activity } from 'lucide-react';

const HospitalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const hospital = mockMedicalCenters.find(center => center.id === id);
  
  if (!hospital) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Hospital not found</p>
            <Button onClick={() => navigate('/')} className="mt-4 w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supplyDuration = getSupplyDuration(hospital.id);
  
  // Prepare chart data
  const chartData = Object.entries(supplyDuration).map(([key, days]) => ({
    name: RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES],
    days,
    key,
  }));

  const getStatusColor = (days: number) => {
    if (days <= 3) return 'hsl(var(--destructive))';
    if (days <= 7) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  const handleResupply = () => {
    // Calculate resupply amounts (bring each resource to 30 days worth)
    const resupplyAmounts = Object.entries(hospital.resources).map(([key, current]) => {
      const ratio = hospital.maxPatientsCapacity * 1.5; // Average ratio for calculation
      const target = ratio * 30; // 30 days worth
      return { key, amount: Math.max(0, Math.ceil(target - current)) };
    });

    // Check if warehouse has enough stock
    const canResupply = resupplyAmounts.every(({ key, amount }) => {
      return ministryWarehouse[key as keyof typeof ministryWarehouse] >= amount;
    });

    if (canResupply) {
      toast({
        title: 'Resupply Request Submitted',
        description: `Resupply order has been sent to Ministry of Health warehouses for ${hospital.name}.`,
      });
    } else {
      toast({
        title: 'Insufficient Warehouse Stock',
        description: 'Some resources are not available in sufficient quantities at the warehouse.',
        variant: 'destructive',
      });
    }
  };

  const chartConfig = {
    days: {
      label: 'Days Remaining',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">MedStock Crisis Manager</h1>
              <p className="text-sm text-muted-foreground">Ministry of Health - Logistics Tracking</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>

        <div className="space-y-6">
          {/* Hospital Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">{hospital.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Capacity: {hospital.currentPatients}/{hospital.maxPatientsCapacity} patients
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        hospital.status === 'critical'
                          ? 'hsl(var(--destructive))'
                          : hospital.status === 'warning'
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--success))',
                    }}
                  />
                  <span className="text-sm font-medium capitalize">{hospital.status}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(hospital.resources).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}
                    </p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">
                      {supplyDuration[key as keyof typeof supplyDuration]} days remaining
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supply Duration Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Supply Duration Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                Estimated days remaining for each supply based on current usage
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getStatusColor(entry.days)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Supply Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData.map((item) => {
              const days = item.days;
              const isCritical = days <= 3;
              const isWarning = days <= 7 && days > 3;
              
              return (
                <Card
                  key={item.key}
                  className={
                    isCritical
                      ? 'border-l-4 border-l-destructive'
                      : isWarning
                      ? 'border-l-4 border-l-warning'
                      : 'border-l-4 border-l-success'
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{item.name}</CardTitle>
                      {isCritical && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-3xl font-bold">{days}</p>
                        <p className="text-xs text-muted-foreground">days remaining</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Current Stock</p>
                        <p className="text-lg font-semibold">
                          {hospital.resources[item.key as keyof typeof hospital.resources]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resupply Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ministry of Health Resupply
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Request resupply from Ministry of Health warehouses to bring all supplies to 30 days worth
              </p>
            </CardHeader>
            <CardContent>
              <Button onClick={handleResupply} size="lg" className="w-full md:w-auto">
                <Package className="mr-2 h-4 w-4" />
                Request Resupply
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HospitalDetail;

