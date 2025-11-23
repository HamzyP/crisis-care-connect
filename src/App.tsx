import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HospitalDetail from "./pages/HospitalDetail";
import PastDeliveries from "./pages/PastDeliveries";

// Import hospital view app
import HospitalAppRoutes from "../Hospital_view/UCLXImperialXMMU/HospitalApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="crisis-care-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to ministry app */}
            <Route path="/" element={<Navigate to="/ministryofhealth" replace />} />
            
            {/* Ministry of Health routes */}
            <Route path="/ministryofhealth" element={<Index />} />
            <Route path="/ministryofhealth/hospital/:id" element={<HospitalDetail />} />
            <Route path="/ministryofhealth/hospital/:id/deliveries" element={<PastDeliveries />} />
            
            {/* Hospital View routes */}
            <Route path="/hospitalview/*" element={<HospitalAppRoutes />} />
            
            {/* Global catch-all */}
            <Route path="*" element={<Navigate to="/ministryofhealth" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
