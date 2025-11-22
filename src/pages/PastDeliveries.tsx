import { useParams, useNavigate } from 'react-router-dom';
import { mockMedicalCenters, getPastDeliveries } from '@/data/mockData';
import { RESOURCE_NAMES } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, History, Package, CheckCircle2, XCircle, Bot, Hand } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PastDeliveries = () => {
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

  const pastDeliveries = getPastDeliveries(hospital.id);

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
          onClick={() => navigate(`/hospital/${hospital.id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hospital Details
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <History className="h-6 w-6" />
                    Past Deliveries
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delivery history for {hospital.name}
                  </p>
                </div>
                <Badge variant="secondary">
                  {pastDeliveries.length} {pastDeliveries.length === 1 ? 'delivery' : 'deliveries'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Deliveries Table */}
          {pastDeliveries.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Insulin</TableHead>
                      <TableHead>Antibiotics</TableHead>
                      <TableHead>Anaesthesia</TableHead>
                      <TableHead>O2 Tanks</TableHead>
                      <TableHead>IV Fluids</TableHead>
                      <TableHead>Total Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastDeliveries.map((delivery) => {
                      const totalItems = Object.values(delivery.resources).reduce((sum, val) => sum + val, 0);
                      return (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">
                            {delivery.deliveryDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {delivery.deliveryDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {delivery.trackingNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={delivery.orderType === 'automatic' ? 'default' : 'secondary'}
                              className="flex items-center gap-1 w-fit"
                            >
                              {delivery.orderType === 'automatic' ? (
                                <>
                                  <Bot className="h-3 w-3" />
                                  Automatic
                                </>
                              ) : (
                                <>
                                  <Hand className="h-3 w-3" />
                                  Manual
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={delivery.status === 'delivered' ? 'success' : 'destructive'}
                              className="flex items-center gap-1 w-fit"
                            >
                              {delivery.status === 'delivered' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Delivered
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Cancelled
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{delivery.resources.insulin}</TableCell>
                          <TableCell>{delivery.resources.antibiotics}</TableCell>
                          <TableCell>{delivery.resources.anaesthesia}</TableCell>
                          <TableCell>{delivery.resources.o2Tanks}</TableCell>
                          <TableCell>{delivery.resources.ivFluids}</TableCell>
                          <TableCell className="font-semibold">
                            {totalItems.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No Past Deliveries</p>
                  <p className="text-sm text-muted-foreground">
                    No delivery history found for {hospital.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          {pastDeliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Deliveries</p>
                    <p className="text-2xl font-bold">{pastDeliveries.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Successful Deliveries</p>
                    <p className="text-2xl font-bold text-success">
                      {pastDeliveries.filter(d => d.status === 'delivered').length}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      Automatic Orders
                    </p>
                    <p className="text-2xl font-bold">
                      {pastDeliveries.filter(d => d.orderType === 'automatic').length}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Hand className="h-3 w-3" />
                      Manual Orders
                    </p>
                    <p className="text-2xl font-bold">
                      {pastDeliveries.filter(d => d.orderType === 'manual').length}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Items Delivered</p>
                    <p className="text-2xl font-bold">
                      {pastDeliveries
                        .filter(d => d.status === 'delivered')
                        .reduce((sum, d) => sum + Object.values(d.resources).reduce((s, v) => s + v, 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PastDeliveries;

