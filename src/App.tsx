import { FC } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import EntityOnboarding from "./pages/EntityOnboarding";
import CPVForms from "./pages/CPVForms";
import CPVMerchantStatus from "./pages/CPVMerchantStatus";
import MerchantDataView from "./pages/MerchantDataView";
import LeadsManagement from "./pages/LeadsManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: FC = () => {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entity-onboarding" element={<EntityOnboarding />} />
              <Route path="/dashboard/create-forms" element={<CPVForms />} />
              <Route path="/dashboard/merchant-status" element={<CPVMerchantStatus />} />
              <Route path="/cpv-merchant-status" element={<CPVMerchantStatus />} />
              <Route path="/merchant-data/:formId" element={<MerchantDataView />} />
              <Route path="/leads-management/:formId" element={<LeadsManagement />} />
              <Route path="/dashboard/user-management" element={<UserManagement />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;