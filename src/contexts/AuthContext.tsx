
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Cookies from "js-cookie";
import { UserProfile, OnboardingState } from "@/types/profile";
import ProfileService from "@/services/profileService";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  onboardingState: OnboardingState | null;
  signOut: () => Promise<void>;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Track authentication events with Clarity
  const trackAuthEvent = (event: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'auth_event', {
        event,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Load user profile and onboarding state
  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setOnboardingState(null);
      return;
    }

    try {
      setProfileLoading(true);
      
      // Load profile
      const userProfile = await ProfileService.getCurrentProfile();
      setProfile(userProfile);

      // Load onboarding state
      if (userProfile) {
        const status = await ProfileService.getOnboardingStatus();
        setOnboardingState({
          isComplete: status.nextStep === 'complete',
          currentStep: status.nextStep,
          hasRole: status.hasRole,
          hasInterests: status.hasInterests,
          hasOnboardingModule: status.hasOnboardingModule,
          completionPercentage: status.completionPercentage,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Refresh profile data (for use after onboarding updates)
  const refreshProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    //console.log('AuthProvider: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        //console.log('AuthProvider: Auth state changed', { event: event, hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        
        // Track authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          trackAuthEvent('user_signed_in', session.user.id);
          // Set user ID in Clarity for better tracking
          if (window.clarity) {
            window.clarity('identify', session.user.id);
          }
          // Detect and set onboarding module on first sign in
          ProfileService.detectAndSetOnboardingModule();
          
        } else if (event === 'SIGNED_OUT') {
          trackAuthEvent('user_signed_out');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          trackAuthEvent('token_refreshed', session.user.id);
        }
        
        // Save parent name in cookie if available
        if (session?.user?.user_metadata?.full_name) {
          Cookies.set('parentName', session.user.user_metadata.full_name);
        }
      }
    );

    // Check for existing session
    //console.log('AuthProvider: Checking for existing session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      //console.log('AuthProvider: Initial session check complete', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      // Track initial session state
      if (session?.user) {
        trackAuthEvent('session_restored', session.user.id);
        if (window.clarity) {
          window.clarity('identify', session.user.id);
        }
        
      }

      setLoading(false);
    });

    return () => {
      //console.log('AuthProvider: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setOnboardingState(null);
    }
  }, [user]);

  const signOut = async () => {
    // Track sign out event
    if (user) {
      trackAuthEvent('user_sign_out_clicked', user.id);
    }
    
    await supabase.auth.signOut();
    Cookies.remove('parentName');
  };

  const value = {
    session,
    user,
    profile,
    onboardingState,
    signOut,
    loading,
    profileLoading,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
