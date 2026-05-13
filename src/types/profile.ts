import { Database } from './database.types';

// Re-export from service for consistency
export type UserRole = 'teacher' | 'parent' | 'student';
export type OnboardingModule = 'events' | 'music';
export type UserInterest = 'events' | 'music' | 'academics' | 'activities';

// Enhanced profile type with proper typing
export type UserProfile = Database['public']['Tables']['profiles']['Row'];

// Interest configurations for each role
export interface InterestOption {
  id: UserInterest;
  label: string;
  icon: string;
  description: string;
}

export const INTEREST_OPTIONS: Record<UserRole, InterestOption[]> = {
  teacher: [
    { 
      id: 'events', 
      label: 'School Events & Field Trips', 
      icon: '📅', 
      description: 'Track and manage school events for students' 
    },
    { 
      id: 'music', 
      label: 'Music Practice Tracking', 
      icon: '🎵', 
      description: 'Monitor and guide student music practice' 
    },
    { 
      id: 'academics', 
      label: 'Homework & Assignments', 
      icon: '📚', 
      description: 'Assign and track student homework progress' 
    },
  ],
  parent: [
    { 
      id: 'events', 
      label: 'School Events & Activities', 
      icon: '📅', 
      description: 'Stay updated on school events and activities' 
    },
    { 
      id: 'music', 
      label: 'Music Lessons & Practice', 
      icon: '🎵', 
      description: 'Track your child\'s music practice progress' 
    },
    { 
      id: 'activities', 
      label: 'Sports & Extracurriculars', 
      icon: '⚽', 
      description: 'Manage sports and extracurricular activities' 
    },
  ],
  student: [
    { 
      id: 'music', 
      label: 'My Music Practice', 
      icon: '🎵', 
      description: 'Track my own music practice and progress' 
    },
    { 
      id: 'academics', 
      label: 'My Homework & Studies', 
      icon: '📚', 
      description: 'Manage my homework and study schedule' 
    },
    { 
      id: 'activities', 
      label: 'My Activities & Sports', 
      icon: '⚽', 
      description: 'Track my sports and activity participation' 
    },
  ],
};

// Role configurations
export interface RoleOption {
  id: UserRole;
  label: string;
  icon: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'teacher',
    label: 'Teacher',
    icon: '👩‍🏫',
    description: 'I teach students and want to track their progress'
  },
  {
    id: 'parent',
    label: 'Parent',
    icon: '👨‍👩‍👧‍👦',
    description: 'I want to manage my children\'s activities and progress'
  },
  {
    id: 'student',
    label: 'Student',
    icon: '🎓',
    description: 'I want to track my own learning and activities'
  },
];

// Onboarding state interface
export interface OnboardingState {
  isComplete: boolean;
  currentStep: 'role' | 'interests' | 'complete';
  hasRole: boolean;
  hasInterests: boolean;
  hasOnboardingModule: boolean;
  completionPercentage: number;
}

// Helper functions
export const isTeacher = (profile: UserProfile): profile is UserProfile & { role_type: 'teacher' } => {
  return profile.role_type === 'teacher';
};

export const isParent = (profile: UserProfile): profile is UserProfile & { role_type: 'parent' } => {
  return profile.role_type === 'parent';
};

export const isStudent = (profile: UserProfile): profile is UserProfile & { role_type: 'student' } => {
  return profile.role_type === 'student';
};

export const hasInterest = (profile: UserProfile, interest: UserInterest): boolean => {
  return profile.interests?.includes(interest) ?? false;
};

export const getAvailableInterests = (role: UserRole | null): InterestOption[] => {
  if (!role) return [];
  return INTEREST_OPTIONS[role] || [];
};

export const getRoleFromProfile = (profile: UserProfile): UserRole | null => {
  return profile.role_type as UserRole | null;
};

export const getInterestsFromProfile = (profile: UserProfile): UserInterest[] => {
  return (profile.interests as UserInterest[]) || [];
};