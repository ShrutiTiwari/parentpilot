import { Dashboard } from "@/components/Dashboard";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { QuotesCarousel } from "@/components/QuotesCarousel";
import { ChildProfileProvider } from "@/contexts/ChildProfileContext";
import { ChildProfileSelector } from "@/components/profile/ChildProfileSelector";
import { ManageProfilesDialog } from "@/components/profile/ManageProfilesDialog";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
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

  console.log('Index: Rendering', { hasUser: !!user, loading });

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
    console.log('Index: Still loading auth state');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1EAEDB]"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users, dashboard for authenticated users
  if (!user) {
    console.log('Index: No user, showing landing page');
    return <PowerParentIntegratedLanding />;
  }

  console.log('Index: User authenticated, showing dashboard');
  return (
    <ChildProfileProvider>
      <SchoolAuthorizationProvider>
        <AgeThemeProvider>
          <div className="min-h-screen bg-background">
            {/* Top navigation area with sign out and profile buttons */}
            <div className="w-full border-b border-gray-200 bg-white">
              <div className="max-w-[1400px] mx-auto px-4 py-2 flex justify-end items-center gap-2 sm:gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:bg-red-100 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <ChildProfileSelector onManageProfiles={() => setIsProfileDialogOpen(true)} />
              </div>
            </div>
            {/* Main content area */}
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="max-w-[1400px] mx-auto">
                {/* Centered title */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold">Welcome to Power Parent!</h1>
                </div>
                <QuotesCarousel />
                <Dashboard
                  showAuthModal={showAuthModal}
                  setShowAuthModal={handleShowAuthModal}
                  initialActiveTab={initialActiveTab}
                  initialActiveSubTab={initialActiveSubTab}
                />
                <ManageProfilesDialog 
                  open={isProfileDialogOpen} 
                  onOpenChange={setIsProfileDialogOpen}
                  showAuthModal={showAuthModal}
                  setShowAuthModal={handleShowAuthModal}
                />
                <AuthModal
                  open={showAuthModal}
                  onOpenChange={setShowAuthModal}
                  customMessage={getAuthMessage()}
                  onSuccess={() => {
                    console.log('Auth successful, pending operations will resume automatically');
                    // Keep the event dialog open if user was saving an event
                    if (authTriggerAction === 'save_event') {
                      // The event dialog should remain open so user can see their saved event
                      console.log('Keeping event dialog open after auth success');
                    }
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
