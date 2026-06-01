import { useEffect } from 'react';

declare global {
  interface Window {
    clarity: {
      (command: string, ...args: any[]): void;
      q?: any[];
    };
  }
}

/**
 * Custom hook for Microsoft Clarity analytics
 */
export const useClarity = () => {
  useEffect(() => {
    // Ensure Clarity is loaded
    if (typeof window !== 'undefined' && window.clarity) {
    }
  }, []);

  /**
   * Track a custom event
   */
  const trackEvent = (eventName: string, data?: any) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName, data);
    }
  };

  /**
   * Set user ID for tracking
   */
  const setUserId = (userId: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId);
    }
  };

  /**
   * Track page views
   */
  const trackPageView = (pageName: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'page_view', { page: pageName });
    }
  };

  /**
   * Track user actions
   */
  const trackAction = (action: string, details?: any) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'user_action', { action, ...details });
    }
  };

  return {
    trackEvent,
    setUserId,
    trackPageView,
    trackAction
  };
}; 