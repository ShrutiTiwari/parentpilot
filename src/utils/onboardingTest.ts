// Utility functions for testing onboarding flow
// This can be used in browser console to test the onboarding system

import ProfileService from '@/services/profileService';

export const testOnboardingFlow = {
  // Test profile service methods
  async getCurrentProfile() {
    const profile = await ProfileService.getCurrentProfile();
    console.log('Current profile:', profile);
    return profile;
  },

  // Test updating role
  async setRole(role: 'teacher' | 'parent' | 'student') {
    console.log(`Setting role to: ${role}`);
    const success = await ProfileService.updateRole(role);
    console.log('Role update success:', success);
    return success;
  },

  // Test updating interests
  async setInterests(interests: string[]) {
    console.log(`Setting interests to:`, interests);
    const success = await ProfileService.updateInterests(interests as any);
    console.log('Interests update success:', success);
    return success;
  },

  // Test adding a single interest
  async addInterest(interest: string) {
    console.log(`Adding interest: ${interest}`);
    const success = await ProfileService.addInterest(interest as any);
    console.log('Add interest success:', success);
    return success;
  },

  // Test onboarding status
  async getOnboardingStatus() {
    const status = await ProfileService.getOnboardingStatus();
    console.log('Onboarding status:', status);
    return status;
  },

  // Test role checks
  async checkRole(role: 'teacher' | 'parent' | 'student') {
    const hasRole = await ProfileService.hasRole(role);
    console.log(`Has ${role} role:`, hasRole);
    return hasRole;
  },

  // Test interest checks
  async checkInterest(interest: string) {
    const hasInterest = await ProfileService.hasInterest(interest as any);
    console.log(`Has ${interest} interest:`, hasInterest);
    return hasInterest;
  },

  // Reset profile for testing (careful!)
  async resetProfile() {
    console.log('⚠️ Resetting profile for testing...');
    await ProfileService.updateProfile({
      role_type: undefined,
      interests: [],
    });
    console.log('Profile reset complete');
  },

  // Complete onboarding flow test
  async completeOnboardingTest() {
    console.log('🧪 Testing complete onboarding flow...');
    
    // Reset profile
    await this.resetProfile();
    
    // Check initial status
    const initialStatus = await this.getOnboardingStatus();
    console.log('Initial status:', initialStatus);
    
    // Set role
    await this.setRole('teacher');
    
    // Set interests
    await this.setInterests(['music', 'events']);
    
    // Check final status
    const finalStatus = await this.getOnboardingStatus();
    console.log('Final status:', finalStatus);
    
    console.log('🎉 Onboarding test complete!');
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testOnboarding = testOnboardingFlow;
  console.log('🔧 Onboarding test utils available at: window.testOnboarding');
}