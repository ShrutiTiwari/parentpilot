import { Dashboard } from "@/components/Dashboard";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { QuotesCarousel } from "@/components/QuotesCarousel";
import { ChildProfileProvider } from "@/contexts/ChildProfileContext";
import { ManageProfilesDialog } from "@/components/profile/ManageProfilesDialog";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { signOut } from "@/utils/auth";
import { PowerParentIntegratedLanding } from "@/components/PowerParentIntegratedLanding";
import { Header } from "@/components/Header";
import { SchoolAuthorizationProvider } from "@/contexts/SchoolAuthorizationContext";
import { AgeThemeProvider } from "@/contexts/AgeThemeContext";
import { Alert } from '@/components/ui/alert';

const Index = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  // /events/personal → activeTab=events, subTab=personal
  // /sharing/myconnections → activeTab=sharing, subTab=myconnections
  const initialActiveTab = pathParts[0] === 'sharing' || pathParts[0] === 'shareProgress' ? 'sharing' : 'events';
  const initialActiveSubTab = pathParts[1] || undefined;

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTriggerAction, setAuthTriggerAction] = useState<string>('');
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [showSignupBanner, setShowSignupBanner] = useState(true);

  // Note: Auto-save functionality is now handled at the AuthContext level

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    } else {
      toast({
        title: "Signed out successfully"
      });
      window.location.reload();
    }
  };

  // Function to show auth modal with custom message
  const showAuthModalWithMessage = (action: string) => {
    setAuthTriggerAction(action);
    setShowAuthModal(true);
  };

  // Wrapper function that matches the expected signature
  const handleShowAuthModal = (show: boolean, action?: string) => {
    if (action) {
      setAuthTriggerAction(action);
    }
    setShowAuthModal(show);
  };

  // Get custom message based on trigger action
  const getAuthMessage = () => {
    switch (authTriggerAction) {
      case 'save_event':
        return 'Sign up or sign in to save your event';
      case 'create_profile':
        return 'Sign up or sign in to create a child profile';
      case 'school_access':
        return 'Sign up or sign in to access school events';
      case 'general':
        return 'Sign up or sign in to save your events and access them from any device';
      default:
        return 'Sign up or sign in to save your school events';
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1EAEDB]"></div>
      </div>
    );
  }

  // Show landing page only on the root path for unauthenticated users
  // All other routes (e.g. /events) render the dashboard so guests can browse
  if (!user && location.pathname === '/') {
    return <PowerParentIntegratedLanding />;
  }
  return (
    <ChildProfileProvider>
      <SchoolAuthorizationProvider>
        <AgeThemeProvider>
          <div className="min-h-screen bg-background">
            {/* Main content area */}
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="max-w-[1400px] mx-auto">
                <Dashboard
                  showAuthModal={showAuthModal}
                  setShowAuthModal={handleShowAuthModal}
                  onSignOut={handleSignOut}
                  initialActiveTab={initialActiveTab}
                  initialActiveSubTab={initialActiveSubTab}
                />
                {user && (
                  <ManageProfilesDialog
                    open={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                    showAuthModal={showAuthModal}
                    setShowAuthModal={handleShowAuthModal}
                  />
                )}
                <AuthModal
                  open={showAuthModal}
                  onOpenChange={setShowAuthModal}
                  customMessage={getAuthMessage()}
                  onSuccess={() => {
                  }}
                />
              </div>
            </div>
          </div>
        </AgeThemeProvider>
      </SchoolAuthorizationProvider>
    </ChildProfileProvider>
  );
};

export default Index;
