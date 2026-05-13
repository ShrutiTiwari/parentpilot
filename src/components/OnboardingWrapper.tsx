import React, { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import OnboardingFlow from "@/components/auth/OnboardingFlow";
import OnboardingComplete from "@/components/auth/OnboardingComplete";
import { UserRole, UserInterest } from "@/types/profile";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { 
    profile, 
    needsOnboarding, 
    loading, 
    isAuthenticated,
    role,
    interests 
  } = useProfile();
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedRole, setCompletedRole] = useState<UserRole | null>(null);
  const [completedInterests, setCompletedInterests] = useState<UserInterest[]>([]);

  // Don't show onboarding if user is not authenticated or still loading
  if (!isAuthenticated || loading) {
    return <>{children}</>;
  }

  // Don't show onboarding if profile is complete and user has seen onboarding
  if (!needsOnboarding || !showOnboarding) {
    return <>{children}</>;
  }

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    
    // Show completion modal if we have role and interests
    if (role && interests.length > 0) {
      setCompletedRole(role);
      setCompletedInterests(interests);
      setShowCompletion(true);
    }
  };

  // Handle completion modal close
  const handleCompletionClose = () => {
    setShowCompletion(false);
  };

  return (
    <>
      {children}
      
      {/* Onboarding Flow */}
      {showOnboarding && needsOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      
      {/* Completion Modal */}
      {showCompletion && completedRole && (
        <OnboardingComplete
          open={showCompletion}
          role={completedRole}
          interests={completedInterests}
          onGetStarted={handleCompletionClose}
        />
      )}
    </>
  );
}

export default OnboardingWrapper;