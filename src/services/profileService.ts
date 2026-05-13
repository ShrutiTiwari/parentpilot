import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRole = 'teacher' | 'parent' | 'student';
export type OnboardingModule = 'events' | 'music';
export type UserInterest = 'events' | 'music' | 'academics' | 'activities';

export interface ProfileData {
  role_type?: UserRole;
  onboarding_module?: OnboardingModule;
  interests?: UserInterest[];
}

export class ProfileService {
  
  /**
   * Get current user's profile
   */
  static async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Update onboarding module (usually called on first app entry)
   */
  static async updateOnboardingModule(module: OnboardingModule): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        onboarding_module: module,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating onboarding module:', error);
      return false;
    }

    return true;
  }

  /**
   * Update user role (during role selection step)
   */
  static async updateRole(role: UserRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        role_type: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating role:', error);
      return false;
    }

    return true;
  }

  /**
   * Update user interests (during interest selection step)
   */
  static async updateInterests(interests: UserInterest[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        interests,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating interests:', error);
      return false;
    }

    return true;
  }

  /**
   * Add a new interest to existing interests
   */
  static async addInterest(newInterest: UserInterest): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    if (!profile) return false;

    const currentInterests = profile.interests || [];
    if (currentInterests.includes(newInterest)) {
      return true; // Already has this interest
    }

    const updatedInterests = [...currentInterests, newInterest];
    return await this.updateInterests(updatedInterests);
  }

  /**
   * Remove an interest from existing interests
   */
  static async removeInterest(interestToRemove: UserInterest): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    if (!profile) return false;

    const currentInterests = profile.interests || [];
    const updatedInterests = currentInterests.filter(interest => interest !== interestToRemove);
    
    return await this.updateInterests(updatedInterests);
  }

  /**
   * Update multiple profile fields at once
   */
  static async updateProfile(updates: ProfileData): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  }

  /**
   * Check if profile needs onboarding
   */
  static async needsOnboarding(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    if (!profile) return true;

    // Profile needs onboarding if missing role or interests
    return !profile.role_type || !profile.interests || profile.interests.length === 0;
  }

  /**
   * Get onboarding completion status
   */
  static async getOnboardingStatus(): Promise<{
    hasRole: boolean;
    hasInterests: boolean;
    hasOnboardingModule: boolean;
    completionPercentage: number;
    nextStep: 'role' | 'interests' | 'complete';
  }> {
    const profile = await this.getCurrentProfile();
    
    const hasRole = !!profile?.role_type;
    const hasInterests = !!(profile?.interests && profile.interests.length > 0);
    const hasOnboardingModule = !!profile?.onboarding_module;

    const completedSteps = [hasRole, hasInterests, hasOnboardingModule].filter(Boolean).length;
    const completionPercentage = Math.round((completedSteps / 3) * 100);

    let nextStep: 'role' | 'interests' | 'complete' = 'complete';
    if (!hasRole) nextStep = 'role';
    else if (!hasInterests) nextStep = 'interests';

    return {
      hasRole,
      hasInterests,
      hasOnboardingModule,
      completionPercentage,
      nextStep,
    };
  }

  /**
   * Detect and set onboarding module based on current URL/path
   */
  static async detectAndSetOnboardingModule(): Promise<void> {
    const profile = await this.getCurrentProfile();
    
    // Only set if not already set
    if (profile?.onboarding_module) return;

    // Detect from URL
    const currentPath = window.location.pathname;
    let detectedModule: OnboardingModule;

    if (currentPath.includes('music') || currentPath.includes('practice')) {
      detectedModule = 'music';
    } else {
      detectedModule = 'events'; // Default to events
    }

    await this.updateOnboardingModule(detectedModule);
  }

  /**
   * Check if user has specific interest
   */
  static async hasInterest(interest: UserInterest): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile?.interests?.includes(interest) ?? false;
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: UserRole): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile?.role_type === role;
  }
}

export default ProfileService;