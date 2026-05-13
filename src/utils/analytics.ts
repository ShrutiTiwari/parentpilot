// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

// Analytics configuration - use environment variable or fallback to production
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-75MTLQWJRY';

/**
 * Initialize Google Analytics (called automatically by gtag script)
 */
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    const isProduction = import.meta.env.PROD;
    const hasGaId = !!import.meta.env.VITE_GA4_MEASUREMENT_ID;

    console.log('📊 Google Analytics initialized', {
      environment: isProduction ? 'production' : 'development',
      measurementId: GA_MEASUREMENT_ID,
      hasCustomId: hasGaId
    });
  }
};

/**
 * Track page views
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path,
        page_title: title,
      });
      console.log('📊 Page view tracked:', path, title);
    } catch (error) {
      console.warn('📊 Error tracking page view:', error);
    }
  }
};

/**
 * Track custom events
 */
export const trackEvent = (eventName: string, parameters?: {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, {
        event_category: parameters?.event_category || 'engagement',
        event_label: parameters?.event_label,
        value: parameters?.value,
        ...parameters,
      });
      console.log('📊 Event tracked:', eventName, parameters);
    } catch (error) {
      console.warn('📊 Error tracking event:', error);
    }
  }
};

/**
 * Track user actions specific to PowerParent
 */
export const PowerParentAnalytics = {
  // Authentication events
  trackSignUp: (method: string = 'email') => {
    trackEvent('sign_up', {
      event_category: 'authentication',
      method,
    });
  },

  trackLogin: (method: string = 'email') => {
    trackEvent('login', {
      event_category: 'authentication',
      method,
    });
  },

  trackLogout: () => {
    trackEvent('logout', {
      event_category: 'authentication',
    });
  },

  // Music practice events
  trackPracticeSession: (module: string, duration?: number) => {
    trackEvent('practice_session_completed', {
      event_category: 'music_practice',
      event_label: module,
      value: duration,
      module_type: module,
    });
  },

  trackScalePractice: (scale: string, grade: string) => {
    trackEvent('scale_practiced', {
      event_category: 'music_practice',
      event_label: `${grade}_${scale}`,
      scale_name: scale,
      grade: grade,
    });
  },

  trackPiecePractice: (piece: string, grade: string, composer?: string) => {
    trackEvent('piece_practiced', {
      event_category: 'music_practice',
      event_label: `${grade}_${piece}`,
      piece_name: piece,
      grade: grade,
      composer: composer,
    });
  },

  trackExamDateSet: (grade: string, examDate: string) => {
    trackEvent('exam_date_set', {
      event_category: 'exam_preparation',
      event_label: grade,
      grade: grade,
      exam_date: examDate,
    });
  },

  // Learner management events
  trackLearnerCreated: (instrument?: string, grade?: string) => {
    trackEvent('learner_created', {
      event_category: 'learner_management',
      instrument: instrument,
      grade: grade,
    });
  },

  trackLearnerUpdated: (field: string) => {
    trackEvent('learner_updated', {
      event_category: 'learner_management',
      event_label: field,
      updated_field: field,
    });
  },

  // Sharing and collaboration events
  trackShareCodeGenerated: (resource: string) => {
    trackEvent('share_code_generated', {
      event_category: 'sharing',
      event_label: resource,
      shared_resource: resource,
    });
  },

  trackConnectionRequest: (userRole: 'teacher' | 'parent') => {
    trackEvent('connection_request_sent', {
      event_category: 'sharing',
      event_label: userRole,
      recipient_role: userRole,
    });
  },

  trackConnectionAccepted: (userRole: 'teacher' | 'parent') => {
    trackEvent('connection_accepted', {
      event_category: 'sharing',
      event_label: userRole,
      connection_role: userRole,
    });
  },

  // Feature usage events
  trackFeatureUsed: (feature: string, context?: string) => {
    trackEvent('feature_used', {
      event_category: 'feature_engagement',
      event_label: feature,
      feature_name: feature,
      context: context,
    });
  },

  trackModuleAccessed: (module: 'scales' | 'pieces' | 'theory' | 'aural' | 'sight_reading' | 'calendar') => {
    trackEvent('module_accessed', {
      event_category: 'navigation',
      event_label: module,
      module_type: module,
    });
  },

  // Error tracking
  trackError: (errorType: string, errorMessage: string, context?: string) => {
    trackEvent('error_occurred', {
      event_category: 'errors',
      event_label: errorType,
      error_type: errorType,
      error_message: errorMessage,
      context: context,
    });
  },

  // Search and discovery
  trackSearch: (searchTerm: string, searchType: string, resultsCount?: number) => {
    trackEvent('search', {
      event_category: 'search',
      event_label: searchType,
      search_term: searchTerm,
      search_type: searchType,
      results_count: resultsCount,
    });
  },

  // Conversion goals
  trackGoalCompleted: (goalType: string, value?: number) => {
    trackEvent('goal_completed', {
      event_category: 'conversions',
      event_label: goalType,
      goal_type: goalType,
      value: value,
    });
  },

  // Time tracking
  trackTimeSpent: (section: string, timeInSeconds: number) => {
    trackEvent('time_spent', {
      event_category: 'engagement',
      event_label: section,
      value: timeInSeconds,
      section: section,
    });
  },
};

/**
 * Set user properties for better analytics segmentation
 */
export const setUserProperties = (properties: {
  user_role?: 'parent' | 'teacher' | 'student';
  subscription_tier?: 'free' | 'premium';
  learners_count?: number;
  instruments?: string[];
  grades?: string[];
  [key: string]: any;
}) => {
  if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_properties: properties,
      });
      console.log('📊 User properties set:', properties);
    } catch (error) {
      console.warn('📊 Error setting user properties:', error);
    }
  }
};

/**
 * Set user ID for cross-session tracking
 */
export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
      });
      console.log('📊 User ID set:', userId);
    } catch (error) {
      console.warn('📊 Error setting user ID:', error);
    }
  }
};

export default PowerParentAnalytics;