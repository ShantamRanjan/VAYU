import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import SolarUpload from "@/pages/SolarUpload";
import SolarResults from "@/pages/SolarResults";
import WindMap from "@/pages/WindMap";
import WindAlerts from "@/pages/WindAlerts";
import WindForecast from "@/pages/WindForecast";
import WindAccuracy from "@/pages/WindAccuracy";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/solar" element={<Navigate to="/solar/upload" replace />} />
              <Route path="/solar/upload" element={<SolarUpload />} />
              <Route path="/solar/results" element={<SolarResults />} />
              <Route path="/wind" element={<Navigate to="/wind/map" replace />} />
              <Route path="/wind/map" element={<WindMap />} />
              <Route path="/wind/alerts" element={<WindAlerts />} />
              <Route path="/wind/forecast" element={<WindForecast />} />
              <Route path="/wind/accuracy" element={<WindAccuracy />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
