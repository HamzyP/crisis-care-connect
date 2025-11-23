import { useState } from 'react';
import { useMedicalCenters } from '@/hooks/useMedicalCenters';
import MapView from '@/components/MapView';
import DashboardView from '@/components/DashboardView';
import TableView from '@/components/TableView';
import ThemeToggle from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { centers } = useMedicalCenters();

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardView centers={centers} />
          </TabsContent>

          <TabsContent value="map" className="h-[calc(100vh-200px)]">
            <MapView centers={centers} />
          </TabsContent>

          <TabsContent value="table">
            <TableView centers={centers} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
