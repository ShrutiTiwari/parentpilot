import React, { useState, useEffect } from "react";
import { RoleSelectionModal } from "./RoleSelectionModal";
import { InterestSelectionModal } from "./InterestSelectionModal";
import { useProfile } from "@/hooks/useProfile";
import { UserRole, UserInterest } from "@/types/profile";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, needsOnboarding, onboardingStep } = useProfile();
  const { refreshProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'role' | 'interests' | 'complete'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Initialize onboarding state
  useEffect(() => {
    if (!needsOnboarding) {
      setCurrentStep('complete');
      return;
    }

    // Set initial step based on profile completion
    if (!profile?.role_type) {
      setCurrentStep('role');
      setShowRoleModal(true);
    } else if (!profile?.interests || profile.interests.length === 0) {
      setCurrentStep('interests');
      setSelectedRole(profile.role_type as UserRole);
      setShowInterestModal(true);
    } else {
      setCurrentStep('complete');
    }
  }, [profile, needsOnboarding, onboardingStep]);

  // Handle role selection completion
  const handleRoleSelected = async (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleModal(false);
    
    // Refresh profile to get updated data
    await refreshProfile();
    
    // Move to interests step
    setCurrentStep('interests');
    setShowInterestModal(true);
  };

  // Handle interest selection completion
  const handleInterestsSelected = async (interests: UserInterest[]) => {
    setShowInterestModal(false);
    
    // Refresh profile to get updated data
    await refreshProfile();
    
    // Complete onboarding
    setCurrentStep('complete');
    onComplete();
  };


  // Don't render anything if onboarding is complete
  if (currentStep === 'complete') {
    return null;
  }

  return (
    <>
      <RoleSelectionModal
        open={showRoleModal}
        onRoleSelected={handleRoleSelected}
      />
      
      <InterestSelectionModal
        open={showInterestModal}
        role={selectedRole || (profile?.role_type as UserRole) || 'parent'}
        onInterestsSelected={handleInterestsSelected}
        detectedModule={profile?.onboarding_module as 'events' | 'music'}
      />
    </>
  );
}

export default OnboardingFlow;