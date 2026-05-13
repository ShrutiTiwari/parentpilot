import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, setUserId } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

/**
 * RouteTracker component that automatically tracks page views
 * when the route changes in React Router
 */
export const RouteTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Set user ID for analytics if user is logged in
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    // Track page view when route changes
    const path = location.pathname + location.search;

    // Generate page title from path
    const generatedTitle = generatePageTitle(path);

    // Set document title for SEO and analytics
    document.title = generatedTitle;

    // Track the page view with the generated title
    trackPageView(path, generatedTitle);

    // Scroll to top on route change (optional UX improvement)
    window.scrollTo(0, 0);
  }, [location]);

  return null; // This component doesn't render anything
};

/**
 * Generate a readable page title from the path for analytics
 */
const generatePageTitle = (path: string): string => {
  // Remove leading slash and split by slashes
  const segments = path.replace(/^\//, '').split('/').filter(Boolean);

  if (segments.length === 0) return 'PowerParent - Music Practice Tracker';

  // Handle specific route patterns
  if (segments[0] === 'music') {
    // Pattern: /music/abrsm/grade/6/learner/{learnerId}/scales
    if (segments[1] === 'abrsm' && segments[2] === 'grade') {
      const grade = segments[3];

      // Check if it has learner
      if (segments[4] === 'learner') {
        const module = segments[6]; // scales, pieces, etc.
        if (module) {
          return `ABRSM Grade ${grade} ${capitalizeFirst(module)} - Individual Practice | PowerParent`;
        }
        return `ABRSM Grade ${grade} Individual Practice | PowerParent`;
      }

      // Without learner (grade overview)
      const module = segments[4];
      if (module) {
        return `ABRSM Grade ${grade} ${capitalizeFirst(module)} - All Students | PowerParent`;
      }
      return `ABRSM Grade ${grade} Overview | PowerParent`;
    }

    // Post Grade 8 routes: /music/abrsm/post-grade-8/...
    if (segments[1] === 'abrsm' && segments[2] === 'post-grade-8') {
      const module = segments[3];
      if (module) {
        return `Post Grade 8 ${capitalizeFirst(module)} | PowerParent`;
      }
      return 'Post Grade 8 Music Practice | PowerParent';
    }

    // Legacy pattern: /music/learner/{learnerId}/...
    if (segments[1] === 'learner') {
      const section = segments[3];
      if (section) {
        return `Music ${capitalizeFirst(section)} - Individual Practice | PowerParent`;
      }
      return 'Music Practice - Individual | PowerParent';
    }

    // Simple music routes: /music/scales, /music/pieces
    if (segments[1]) {
      return `Music ${capitalizeFirst(segments[1])} Practice | PowerParent`;
    }

    return 'Music Practice Dashboard | PowerParent';
  }

  // Events routing
  if (segments[0] === 'events') {
    if (segments[1]) {
      return `${capitalizeFirst(segments[1])} Events | PowerParent`;
    }
    return 'Events Calendar | PowerParent';
  }

  // Sharing routes
  if (segments[0] === 'shareProgress') {
    if (segments[1]) {
      return `Share Progress - ${capitalizeFirst(segments[1])} | PowerParent`;
    }
    return 'Share Progress | PowerParent';
  }

  // Other specific routes
  if (segments[0] === 'auth') return 'Sign In | PowerParent';
  if (segments[0] === 'shared') return 'Shared Progress View | PowerParent';
  if (segments[0] === 'landing') return 'PowerParent - Music Practice Management for Parents & Teachers';
  if (segments[0] === 'home') return 'Dashboard | PowerParent';

  // Default: capitalize first segment
  return `${capitalizeFirst(segments[0])} | PowerParent`;
};

/**
 * Utility function to capitalize first letter and replace hyphens/underscores with spaces
 * Also handles special cases for music modules
 */
const capitalizeFirst = (str: string): string => {
  // Special cases for music modules
  const specialCases: { [key: string]: string } = {
    'sightreading': 'Sight Reading',
    'sight_reading': 'Sight Reading',
    'sight-reading': 'Sight Reading',
    'aural': 'Aural',
    'theory': 'Theory',
    'scales': 'Scales',
    'pieces': 'Pieces',
    'overview': 'Overview',
    'repertoire': 'Repertoire',
    'goals': 'Goals',
    'notes': 'Notes'
  };

  // Check for special cases first
  const lowerStr = str.toLowerCase();
  if (specialCases[lowerStr]) {
    return specialCases[lowerStr];
  }

  // Default capitalization
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default RouteTracker;