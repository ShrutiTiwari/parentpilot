import { useState, useCallback } from 'react';

interface DonationMetrics {
  totalSessions: number;
  daysSinceFirstVisit: number;
  featuresUsed: string[];
  lastDonationPrompt: string | null;
}

interface UseDonationReturn {
  shouldShowDonation: boolean;
  donationMetrics: DonationMetrics;
  trackPracticeSession: () => void;
  trackFeatureUse: (feature: string) => void;
  dismissDonationPrompt: (duration?: 'session' | 'week' | 'month') => void;
  resetDonationPrompts: () => void;
}

export function useDonation(): UseDonationReturn {
  const [metrics, setMetrics] = useState<DonationMetrics>(() => {
    try {
      // Initialize metrics from localStorage
      const firstVisit = localStorage.getItem('app_first_visit');
      const totalSessions = parseInt(localStorage.getItem('total_practice_sessions') || '0');
      const featuresUsed = JSON.parse(localStorage.getItem('features_used') || '[]');
      const lastDonationPrompt = localStorage.getItem('last_donation_prompt');
      
      const daysSinceFirstVisit = firstVisit 
        ? Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        totalSessions,
        daysSinceFirstVisit,
        featuresUsed,
        lastDonationPrompt
      };
    } catch (error) {
      // Return safe defaults
      return {
        totalSessions: 0,
        daysSinceFirstVisit: 0,
        featuresUsed: [],
        lastDonationPrompt: null
      };
    }
  });

  // Determine if donation prompt should be shown
  const shouldShowDonation = useCallback((): boolean => {
    // Don't show if recently dismissed
    const dismissedUntil = localStorage.getItem('donation_dismissed_until');
    if (dismissedUntil && new Date() < new Date(dismissedUntil)) {
      return false;
    }

    // Don't show on first day
    if (metrics.daysSinceFirstVisit < 1) {
      return false;
    }

    // Show based on usage patterns
    const shouldShow = (
      metrics.daysSinceFirstVisit >= 3 || // After 3 days
      metrics.totalSessions >= 10 || // After 10 practice sessions
      metrics.featuresUsed.length >= 5 // After using 5+ features
    );

    return shouldShow;
  }, [metrics]);

  const trackPracticeSession = useCallback(() => {
    const newTotal = metrics.totalSessions + 1;
    localStorage.setItem('total_practice_sessions', newTotal.toString());
    setMetrics(prev => ({ ...prev, totalSessions: newTotal }));
  }, [metrics.totalSessions]);

  const trackFeatureUse = useCallback((feature: string) => {
    const updatedFeatures = [...new Set([...metrics.featuresUsed, feature])];
    localStorage.setItem('features_used', JSON.stringify(updatedFeatures));
    setMetrics(prev => ({ ...prev, featuresUsed: updatedFeatures }));
  }, [metrics.featuresUsed]);

  const dismissDonationPrompt = useCallback((duration: 'session' | 'week' | 'month' = 'session') => {
    const now = new Date();
    
    switch (duration) {
      case 'week':
        now.setDate(now.getDate() + 7);
        localStorage.setItem('donation_dismissed_until', now.toISOString());
        break;
      case 'month':
        now.setMonth(now.getMonth() + 1);
        localStorage.setItem('donation_dismissed_until', now.toISOString());
        break;
      default:
        // Session only
        sessionStorage.setItem('donation_dismissed_session', 'true');
    }

    localStorage.setItem('last_donation_prompt', new Date().toISOString());
    setMetrics(prev => ({ ...prev, lastDonationPrompt: new Date().toISOString() }));
  }, []);

  const resetDonationPrompts = useCallback(() => {
    localStorage.removeItem('donation_dismissed_until');
    localStorage.removeItem('last_donation_prompt');
    sessionStorage.removeItem('donation_dismissed_session');
    setMetrics(prev => ({ ...prev, lastDonationPrompt: null }));
  }, []);

  return {
    shouldShowDonation: shouldShowDonation(),
    donationMetrics: metrics,
    trackPracticeSession,
    trackFeatureUse,
    dismissDonationPrompt,
    resetDonationPrompts
  };
}

// Helper function to initialize first visit tracking
export function initializeUserTracking() {
  if (!localStorage.getItem('app_first_visit')) {
    localStorage.setItem('app_first_visit', new Date().toISOString());
  }
}