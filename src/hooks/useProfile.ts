import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, UserRole, UserInterest, isTeacher, isParent, isStudent, hasInterest } from '@/types/profile';

export interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  
  // Convenience properties
  isAuthenticated: boolean;
  hasProfile: boolean;
  role: UserRole | null;
  interests: UserInterest[];
  
  // Role checks
  isTeacher: boolean;
  isParent: boolean;
  isStudent: boolean;
  
  // Interest checks
  hasEventsInterest: boolean;
  hasMusicInterest: boolean;
  hasAcademicsInterest: boolean;
  hasActivitiesInterest: boolean;
  
  // Onboarding status
  needsOnboarding: boolean;
  onboardingStep: 'role' | 'interests' | 'complete';
  onboardingComplete: boolean;
}

/**
 * Custom hook for accessing user profile data and utilities
 */
export const useProfile = (): UseProfileReturn => {
  const { user, profile, profileLoading, refreshProfile, onboardingState } = useAuth();

  const hasProfile = profile !== null;
  const role = profile?.role_type as UserRole | null;
  const interests = (profile?.interests as UserInterest[]) || [];

  return {
    profile,
    loading: profileLoading,
    refreshProfile,
    
    // Convenience properties
    isAuthenticated: !!user,
    hasProfile,
    role,
    interests,
    
    // Role checks
    isTeacher: hasProfile && isTeacher(profile),
    isParent: hasProfile && isParent(profile),
    isStudent: hasProfile && isStudent(profile),
    
    // Interest checks  
    hasEventsInterest: hasProfile && hasInterest(profile, 'events'),
    hasMusicInterest: hasProfile && hasInterest(profile, 'music'),
    hasAcademicsInterest: hasProfile && hasInterest(profile, 'academics'),
    hasActivitiesInterest: hasProfile && hasInterest(profile, 'activities'),
    
    // Onboarding status
    needsOnboarding: !onboardingState?.isComplete ?? true,
    onboardingStep: onboardingState?.currentStep ?? 'role',
    onboardingComplete: onboardingState?.isComplete ?? false,
  };
};

export default useProfile;