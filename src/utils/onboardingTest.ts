// Utility functions for testing onboarding flow
// This can be used in browser console to test the onboarding system

import ProfileService from '@/services/profileService';

export const testOnboardingFlow = {
  // Test profile service methods
  async getCurrentProfile() {
    const profile = await ProfileService.getCurrentProfile();
    return profile;
  },

  // Test updating role
  async setRole(role: 'teacher' | 'parent' | 'student') {
    const success = await ProfileService.updateRole(role);
    return success;
  },

  // Test updating interests
  async setInterests(interests: string[]) {
    const success = await ProfileService.updateInterests(interests as any);
    return success;
  },

  // Test adding a single interest
  async addInterest(interest: string) {
    const success = await ProfileService.addInterest(interest as any);
    return success;
  },

  // Test onboarding status
  async getOnboardingStatus() {
    const status = await ProfileService.getOnboardingStatus();
    return status;
  },

  // Test role checks
  async checkRole(role: 'teacher' | 'parent' | 'student') {
    const hasRole = await ProfileService.hasRole(role);
    return hasRole;
  },

  // Test interest checks
  async checkInterest(interest: string) {
    const hasInterest = await ProfileService.hasInterest(interest as any);
    return hasInterest;
  },

  // Reset profile for testing (careful!)
  async resetProfile() {
    await ProfileService.updateProfile({
      role_type: undefined,
      interests: [],
    });
  },

  // Complete onboarding flow test
  async completeOnboardingTest() {
    
    // Reset profile
    await this.resetProfile();
    
    // Check initial status
    const initialStatus = await this.getOnboardingStatus();
    
    // Set role
    await this.setRole('teacher');
    
    // Set interests
    await this.setInterests(['music', 'events']);
    
    // Check final status
    const finalStatus = await this.getOnboardingStatus();
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testOnboarding = testOnboardingFlow;
}