import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { ChildProfileProvider } from '../contexts/ChildProfileContext';
import { SchoolAuthorizationProvider } from '../contexts/SchoolAuthorizationContext';
import { AgeThemeProvider } from '../contexts/AgeThemeContext';
import { AuthModal } from './auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { signOut } from '@/utils/auth';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { parseUrlParams } from '../utils/navigationUtils';

interface DashboardWrapperProps {
  activeTab?: string;
  activeSubTab?: string;
  initialActiveSharingSubTab?: string;
}

export function DashboardWrapper({ activeTab, activeSubTab, initialActiveSharingSubTab }: DashboardWrapperProps = {}) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTriggerAction, setAuthTriggerAction] = useState<string>('');
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { learnerId } = useParams(); // Extract learnerId from URL params
  const location = useLocation();
  const navigate = useNavigate();

  // Note: Auto-save functionality is now handled at the AuthContext level
  
  // Parse new URL structure for grade-first navigation
  const urlParams = parseUrlParams(location.pathname);
  const { grade: urlGrade, module: urlModule, learnerId: urlLearnerId, isPostGrade8: urlIsPostGrade8, sharingTab: urlSharingTab } = urlParams;
  
  // Use URL parameters if available, otherwise fall back to props
  const effectiveGrade = urlGrade !== undefined ? urlGrade : undefined;
  const effectiveModule = urlModule || activeSubTab;
  const effectiveLearnerId = urlLearnerId || learnerId;
  const effectiveIsPostGrade8 = urlIsPostGrade8 || false;
  const effectiveSharingTab = urlSharingTab || initialActiveSharingSubTab;

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
      // Navigate to landing page after logout
      navigate('/');
    }
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

  // Show dashboard for all users, with limited features for unauthenticated
  return (
    <ChildProfileProvider>
      <SchoolAuthorizationProvider>
        <AgeThemeProvider>
          <Dashboard 
            showAuthModal={showAuthModal} 
            setShowAuthModal={handleShowAuthModal} 
            onSignOut={handleSignOut}
            initialActiveTab={activeTab}
            initialActiveSubTab={effectiveModule}
            initialActiveSharingSubTab={effectiveSharingTab}
            learnerId={effectiveLearnerId} // Pass effective learnerId to Dashboard
            urlGrade={effectiveGrade} // Pass URL grade for new navigation
            urlIsPostGrade8={effectiveIsPostGrade8} // Pass Post Grade 8 status
          />
          {/* AuthModal, etc. */}
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
        </AgeThemeProvider>
      </SchoolAuthorizationProvider>
    </ChildProfileProvider>
  );
} 