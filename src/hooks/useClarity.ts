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
      console.log('Microsoft Clarity loaded successfully');
    }
  }, []);

  /**
   * Track a custom event
   */
  const trackEvent = (eventName: string, data?: any) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName, data);
      console.log('Clarity event tracked:', eventName, data);
    }
  };

  /**
   * Set user ID for tracking
   */
  const setUserId = (userId: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId);
      console.log('Clarity user ID set:', userId);
    }
  };

  /**
   * Track page views
   */
  const trackPageView = (pageName: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'page_view', { page: pageName });
      console.log('Clarity page view tracked:', pageName);
    }
  };

  /**
   * Track user actions
   */
  const trackAction = (action: string, details?: any) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'user_action', { action, ...details });
      console.log('Clarity action tracked:', action, details);
    }
  };

  return {
    trackEvent,
    setUserId,
    trackPageView,
    trackAction
  };
}; 