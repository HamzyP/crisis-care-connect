import { useParams, useNavigate } from 'react-router-dom';
import { useMedicalCenters } from '@/hooks/useMedicalCenters';
import { getSupplyDuration, ministryWarehouse, getActiveDeliveries } from '@/data/mockData';
import { RESOURCE_NAMES, getResourceStatus } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Package, AlertTriangle, Truck, CheckCircle2, Clock, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const HospitalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { centers, indonesianHospitalUsageRates } = useMedicalCenters();
  
  const hospital = centers.find(center => center.id === id);
  
  if (!hospital) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Hospital not found</p>
            <Button onClick={() => navigate('/ministryofhealth')} className="mt-4 w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supplyDuration = getSupplyDuration(hospital, indonesianHospitalUsageRates);
  const activeDelivery = getActiveDeliveries(hospital);
  const resourceStatuses = getResourceStatus(hospital, indonesianHospitalUsageRates);
  
  // Prepare chart data - use same data source for consistency
  const chartData = Object.entries(supplyDuration).map(([key, days]) => {
    // Determine color based on resource status (consistent with top overview)
    let color = 'hsl(var(--success))';
    if (resourceStatuses.critical.includes(key)) {
      color = 'hsl(var(--destructive))';
    } else if (resourceStatuses.warning.includes(key)) {
      color = 'hsl(var(--warning))';
    }
    
    return {
      name: RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES],
      days,
      key,
      color,
    };
  });

  const getStatusColor = (resourceKey: string) => {
    // Use resource status for color, not days
    if (resourceStatuses.critical.includes(resourceKey)) {
      return 'hsl(var(--destructive))';
    }
    if (resourceStatuses.warning.includes(resourceKey)) {
      return 'hsl(var(--warning))';
    }
    return 'hsl(var(--success))';
  };

  // Get resource status class and styling - each resource shows its own color
  const getResourceStatusInfo = (resourceKey: string) => {
    // Each resource shows its own status color, regardless of hospital status
    if (resourceStatuses.critical.includes(resourceKey)) {
      return {
        isHighlighted: true,
        className: 'bg-destructive/10 border-2 border-destructive',
        textClassName: 'text-destructive font-semibold',
        valueClassName: 'text-destructive',
        daysClassName: 'text-destructive font-medium',
      };
    }
    if (resourceStatuses.warning.includes(resourceKey)) {
      return {
        isHighlighted: true,
        className: 'bg-warning/10 border-2 border-warning',
        textClassName: 'text-warning font-semibold',
        valueClassName: 'text-warning',
        daysClassName: 'text-warning font-medium',
      };
    }
    if (resourceStatuses.good.includes(resourceKey)) {
      return {
        isHighlighted: true,
        className: 'bg-success/10 border-2 border-success',
        textClassName: 'text-success font-semibold',
        valueClassName: 'text-success',
        daysClassName: 'text-success font-medium',
      };
    }
    return {
      isHighlighted: false,
      className: '',
      textClassName: 'text-muted-foreground',
      valueClassName: '',
      daysClassName: 'text-muted-foreground',
    };
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
        title: 'Resupply Dispatched',
        description: `Resupply order has been sent from Ministry of Health warehouses to ${hospital.name}.`,
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
          onClick={() => navigate('/ministryofhealth')}
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
                {Object.entries(hospital.resources).map(([key, value]) => {
                  const statusInfo = getResourceStatusInfo(key);
                  return (
                    <div 
                      key={key} 
                      className={`space-y-1 p-3 rounded-lg transition-colors ${statusInfo.className}`}
                    >
                      <p className={`text-sm ${statusInfo.textClassName}`}>
                        {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}
                      </p>
                      <p className={`text-2xl font-bold ${statusInfo.valueClassName}`}>
                        {value}
                      </p>
                      <p className={`text-xs ${statusInfo.daysClassName}`}>
                        {supplyDuration[key as keyof typeof supplyDuration]} days remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Staff & Departments */}
          {hospital.departments && hospital.departments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Staff & Departments
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Medical staff and department information
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospital.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{dept.specialistTitle}:</span>
                        <span className="text-lg font-bold text-primary">{dept.specialistCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Total Staff:</span>{' '}
                    {hospital.departments.reduce((sum, dept) => sum + dept.specialistCount, 0)} specialists
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send Resupply Button - Moved Higher */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ministry of Health Resupply
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Send resupply from Ministry of Health warehouses to bring all supplies to 30 days worth
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Button onClick={handleResupply} size="lg" className="w-full sm:w-auto">
                  <Package className="mr-2 h-4 w-4" />
                  Send Resupply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/ministryofhealth/hospital/${hospital.id}/deliveries`)}
                  className="w-full sm:w-auto"
                >
                  <History className="mr-2 h-4 w-4" />
                  View Past Deliveries
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Delivery Tracking */}
          {activeDelivery && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery In Transit
                  </CardTitle>
                  <Badge variant={activeDelivery.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                    {activeDelivery.status === 'preparing' && 'Preparing'}
                    {activeDelivery.status === 'in_transit' && 'In Transit'}
                    {activeDelivery.status === 'out_for_delivery' && 'Out for Delivery'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                      <p className="font-mono font-semibold">{activeDelivery.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Arrival</p>
                      <p className="font-semibold">
                        {activeDelivery.estimatedArrival.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {activeDelivery.currentLocation && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Location</p>
                        <p className="font-medium flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {activeDelivery.currentLocation}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Dispatched Date</p>
                      <p className="font-medium">
                        {activeDelivery.dispatchedDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Progress Steps */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">Delivery Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          activeDelivery.status === 'preparing' || activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activeDelivery.status !== 'preparing' ? 'font-medium' : ''}`}>
                            Order Prepared
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activeDelivery.dispatchedDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery' ? 'font-medium' : ''}`}>
                            In Transit
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activeDelivery.currentLocation || 'En route'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          activeDelivery.status === 'out_for_delivery'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {activeDelivery.status === 'out_for_delivery' ? (
                            <Truck className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activeDelivery.status === 'out_for_delivery' ? 'font-medium' : ''}`}>
                            Out for Delivery
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Arriving {activeDelivery.estimatedArrival.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resources in Delivery */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Resources in This Delivery</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(activeDelivery.resources).map(([key, value]) => {
                        // Color-code based on resource status (same as top overview)
                        const isCritical = resourceStatuses.critical.includes(key);
                        const isWarning = resourceStatuses.warning.includes(key);
                        const isGood = resourceStatuses.good.includes(key);
                        
                        // Determine styling based on status
                        let bgColor = 'bg-muted';
                        let textColor = 'text-muted-foreground';
                        let valueColor = '';
                        let borderColor = '';
                        
                        if (isCritical) {
                          bgColor = 'bg-destructive/10';
                          textColor = 'text-destructive';
                          valueColor = 'text-destructive';
                          borderColor = 'border-2 border-destructive';
                        } else if (isWarning) {
                          bgColor = 'bg-warning/10';
                          textColor = 'text-warning';
                          valueColor = 'text-warning';
                          borderColor = 'border-2 border-warning';
                        } else if (isGood && value > 0) {
                          bgColor = 'bg-success/10';
                          textColor = 'text-success';
                          valueColor = 'text-success';
                          borderColor = 'border-2 border-success';
                        }
                        
                        return (
                          <div 
                            key={key} 
                            className={`text-center p-2 rounded-lg ${bgColor} ${borderColor} ${value === 0 ? 'opacity-50' : ''}`}
                          >
                            <p className={`text-xs ${textColor} ${isCritical || isWarning ? 'font-semibold' : ''}`}>
                              {RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES]}
                            </p>
                            <p className={`text-lg font-bold ${valueColor || ''}`}>
                              {value}
                            </p>
                            {value === 0 && (
                              <p className="text-xs text-muted-foreground mt-1">Not needed</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                          fill={getStatusColor(entry.key)}
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
              const isCritical = resourceStatuses.critical.includes(item.key);
              const isWarning = resourceStatuses.warning.includes(item.key);
              const isGood = resourceStatuses.good.includes(item.key);
              
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
                      <CardTitle className={`text-sm ${
                        isCritical ? 'text-destructive' : isWarning ? 'text-warning' : 'text-success'
                      }`}>
                        {item.name}
                      </CardTitle>
                      {isCritical && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className={`text-3xl font-bold ${
                          isCritical ? 'text-destructive' : isWarning ? 'text-warning' : 'text-success'
                        }`}>
                          {days}
                        </p>
                        <p className="text-xs text-muted-foreground">days remaining</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Current Stock</p>
                        <p className={`text-lg font-semibold ${
                          isCritical ? 'text-destructive' : isWarning ? 'text-warning' : 'text-success'
                        }`}>
                          {hospital.resources[item.key as keyof typeof hospital.resources]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalDetail;

