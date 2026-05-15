import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChildProfileProvider } from "@/contexts/ChildProfileContext";
import { SchoolAuthorizationProvider } from "@/contexts/SchoolAuthorizationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import ResetPassword from "./pages/ResetPassword";
import SharedCalendar from "./pages/shared/[shareToken]";
import NotFound from "./pages/NotFound";
import ReviewPreview from "./pages/ReviewPreview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ChildProfileProvider>
            <SchoolAuthorizationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/events" element={<Index />} />
                <Route path="/events/*" element={<Index />} />
                <Route path="/sharing" element={<Index />} />
                <Route path="/sharing/*" element={<Index />} />
                <Route path="/shareProgress" element={<Index />} />
                <Route path="/shareProgress/*" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/shared/:shareToken" element={<SharedCalendar />} />
                <Route path="/review-preview" element={<ReviewPreview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SchoolAuthorizationProvider>
          </ChildProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
