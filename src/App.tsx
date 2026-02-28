import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StaffAuthProvider } from "@/hooks/useStaffAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CoordinatorPortal from "./pages/CoordinatorPortal";
import AuditorPortal from "./pages/AuditorPortal";
import AdminPortal from "./pages/AdminPortal";
import SecretaryPortal from "./pages/SecretaryPortal";
import AdminRegistration from "./pages/AdminRegistration";
import ViewMembers from "./pages/ViewMembers";
import PortalLogin from "./pages/PortalLogin";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import MemberAgreement from "./pages/MemberAgreement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StaffAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/coordinator" element={<CoordinatorPortal />} />
              <Route path="/auditor" element={<AuditorPortal />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/secretary" element={<SecretaryPortal />} />
              {/* Map Treasurer to AdminPortal to avoid 404s and share functionality */}
              <Route path="/treasurer" element={<AdminPortal />} />
              {/* Map General Coordinator to CoordinatorPortal */}
              <Route path="/general-coordinator" element={<CoordinatorPortal />} />
              {/* Map Customer Service to SecretaryPortal for now (document management/support) */}
              <Route path="/customer-service" element={<SecretaryPortal />} />
              <Route path="/backhome" element={<Index />} />
              <Route path="/adminregistration" element={<AdminRegistration />} />
              <Route path="/viewmems" element={<ViewMembers />} />
              <Route path="/portal-login" element={<PortalLogin />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/member-agreement" element={<MemberAgreement />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StaffAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
