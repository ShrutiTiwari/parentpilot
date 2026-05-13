import { NavigateFunction } from 'react-router-dom';
import { DEFAULT_BOARD, DEFAULT_GRADE } from '../constants/boards';

/**
 * Navigation utilities for the new grade-first URL structure
 */

export interface NavigationParams {
  grade?: number;
  learnerId?: string;
  module?: string;
  isPostGrade8?: boolean;
  sharingTab?: string;
}

/**
 * Generate URL for grade overview
 */
export const getGradeUrl = (grade: number): string => {
  return `/music/${DEFAULT_BOARD}/grade/${grade}`;
};

/**
 * Generate URL for grade-specific module
 */
export const getGradeModuleUrl = (grade: number, module: string): string => {
  return `/music/${DEFAULT_BOARD}/grade/${grade}/${module}`;
};

/**
 * Generate URL for learner within a grade
 */
export const getGradeLearnerUrl = (grade: number, learnerId: string): string => {
  return `/music/${DEFAULT_BOARD}/grade/${grade}/learner/${learnerId}`;
};

/**
 * Generate URL for learner-specific module within a grade
 */
export const getGradeLearnerModuleUrl = (grade: number, learnerId: string, module: string): string => {
  return `/music/${DEFAULT_BOARD}/grade/${grade}/learner/${learnerId}/${module}`;
};

/**
 * Navigate to grade overview
 */
export const navigateToGrade = (navigate: NavigateFunction, grade: number): void => {
  navigate(getGradeUrl(grade));
};

/**
 * Navigate to grade-specific module
 */
export const navigateToGradeModule = (navigate: NavigateFunction, grade: number, module: string): void => {
  navigate(getGradeModuleUrl(grade, module));
};

/**
 * Navigate to learner within a grade
 */
export const navigateToGradeLearner = (navigate: NavigateFunction, grade: number, learnerId: string): void => {
  navigate(getGradeLearnerUrl(grade, learnerId));
};

/**
 * Navigate to learner-specific module within a grade
 */
export const navigateToGradeLearnerModule = (navigate: NavigateFunction, grade: number, learnerId: string, module: string): void => {
  navigate(getGradeLearnerModuleUrl(grade, learnerId, module));
};

/**
 * Resolve an effective grade to use for navigation.
 * Priority: providedGrade → grade parsed from pathname → DEFAULT_GRADE
 */
export const getEffectiveGrade = (pathname: string, providedGrade?: number): number => {
  if (typeof providedGrade === 'number' && !Number.isNaN(providedGrade)) return providedGrade;
  const { grade } = parseUrlParams(pathname);
  if (typeof grade === 'number' && !Number.isNaN(grade)) return grade;
  return DEFAULT_GRADE;
};

/**
 * Navigate to a module for the effective grade resolved from pathname/providedGrade
 */
export const navigateToModule = (
  navigate: NavigateFunction,
  pathname: string,
  module: string,
  providedGrade?: number,
): void => {
  const grade = getEffectiveGrade(pathname, providedGrade);
  navigate(getGradeModuleUrl(grade, module));
};

/**
 * Generate URL for sharing overview
 */
export const getSharingUrl = (): string => {
  return `/shareProgress`;
};

/**
 * Generate URL for specific sharing subtab
 */
export const getSharingSubtabUrl = (subtab: string): string => {
  return `/shareProgress/${subtab}`;
};

/**
 * Navigate to sharing overview
 */
export const navigateToSharing = (navigate: NavigateFunction): void => {
  navigate(getSharingUrl());
};

/**
 * Navigate to specific sharing subtab
 */
export const navigateToSharingSubtab = (navigate: NavigateFunction, subtab: string): void => {
  navigate(getSharingSubtabUrl(subtab));
};

/**
 * Parse current URL to extract navigation parameters
 */
export const parseUrlParams = (pathname: string): NavigationParams => {
  console.log('🔍 parseUrlParams called with:', pathname);
  const parts = pathname.split('/').filter(Boolean);
  console.log('🔍 URL parts:', parts);

  // Normalize URL modules to internal tab keys
  const normalizeModule = (mod?: string): string | undefined => {
    if (!mod) return mod;
    switch (mod) {
      case 'sight-reading':
        return 'sightreading';
      default:
        return mod;
    }
  };
  
  // Handle sharing URLs - /shareProgress
  if (parts.length >= 1 && parts[0] === 'shareProgress') {
    console.log('🔍 Detected sharing URL');
    
    const baseIndex = 0;
    
    if (parts.length === baseIndex + 1) {
      // /shareProgress
      const result = { sharingTab: 'myconnections' }; // Default to connections tab
      console.log('🔍 Returning sharing result:', result);
      return result;
    } else if (parts.length === baseIndex + 2) {
      // /shareProgress/entercode, etc.
      let sharingTab = parts[baseIndex + 1];
      // Normalize sharing tab names
      if (sharingTab === 'generatecode') sharingTab = 'students'; // Legacy support
      if (sharingTab === 'students') sharingTab = 'students'; 
      if (sharingTab === 'connectemail') sharingTab = 'myconnections'; // Redirect connectemail to myconnections
 
      if (sharingTab === 'pendingapproval') sharingTab = 'pendingapproval';
      if (sharingTab === 'myconnections') sharingTab = 'myconnections';
      
      const result = { sharingTab };
      console.log('🔍 Returning sharing with subtab result:', result);
      return result;
    }
  }
  
  // Handle Post Grade 8 URLs
  if (parts.length >= 3 && parts[0] === 'music' && parts[1] === DEFAULT_BOARD && parts[2] === 'post-grade-8') {
    console.log('🔍 Detected Post Grade 8 URL');
    if (parts.length === 3) {
      // /music/abrsm/post-grade-8
      const result = { grade: 8, isPostGrade8: true };
      console.log('🔍 Returning Post Grade 8 result:', result);
      return result;
    } else if (parts.length === 4) {
      // /music/abrsm/post-grade-8/repertoire
      const result = { grade: 8, module: normalizeModule(parts[3]), isPostGrade8: true };
      console.log('🔍 Returning Post Grade 8 with module result:', result);
      return result;
    }
  }
  
  // Handle regular grade URLs
  if (parts.length >= 4 && parts[0] === 'music' && parts[1] === DEFAULT_BOARD && parts[2] === 'grade') {
    console.log('🔍 Detected regular grade URL');
    const grade = parseInt(parts[3], 10);
    
    if (parts.length === 4) {
      // /music/abrsm/grade/6
      const result = { grade };
      console.log('🔍 Returning grade result:', result);
      return result;
    } else if (parts.length === 5) {
      // /music/abrsm/grade/6/scales
      const result = { grade, module: normalizeModule(parts[4]) };
      console.log('🔍 Returning grade with module result:', result);
      return result;
    } else if (parts.length === 6 && parts[4] === 'learner') {
      // /music/abrsm/grade/6/learner/shlok
      const result = { grade, learnerId: parts[5] };
      console.log('🔍 Returning grade with learner result:', result);
      return result;
    } else if (parts.length === 7 && parts[4] === 'learner') {
      // /music/abrsm/grade/6/learner/shlok/scales
      const result = { grade, learnerId: parts[5], module: normalizeModule(parts[6]) };
      console.log('🔍 Returning grade with learner and module result:', result);
      return result;
    }
  }
  
  console.log('🔍 No matching URL pattern, returning empty object');
  return {};
};

/**
 * Check if current URL is using the new REST structure
 */
export const isUsingNewUrlStructure = (pathname: string): boolean => {
  return pathname.includes(`/music/${DEFAULT_BOARD}/grade/`) || 
         pathname.includes(`/music/${DEFAULT_BOARD}/post-grade-8`) ||
         pathname.startsWith('/shareProgress');
};

/**
 * Get canonical URL for current page
 */
export const getCanonicalUrl = (params: NavigationParams): string => {
  const baseUrl = 'https://powerparent.co.uk';
  
  // Handle sharing URLs
  if (params.sharingTab) {
    if (params.sharingTab === 'myconnections') {
      return `${baseUrl}/shareProgress/myconnections`;
    } else if (params.sharingTab === 'pendingapproval') {
      return `${baseUrl}/shareProgress/pendingapproval`;
    } else if (params.sharingTab === 'students') {
      return `${baseUrl}/shareProgress/students`;
    }
    return `${baseUrl}/shareProgress`;
  }
  
  // Handle Post Grade 8 URLs
  if (params.isPostGrade8) {
    if (params.module) {
      return `${baseUrl}/music/${DEFAULT_BOARD}/post-grade-8/${params.module}`;
    }
    return `${baseUrl}/music/${DEFAULT_BOARD}/post-grade-8`;
  }
  
  if (params.grade && params.learnerId && params.module) {
    return `${baseUrl}/music/${DEFAULT_BOARD}/grade/${params.grade}/learner/${params.learnerId}/${params.module}`;
  } else if (params.grade && params.learnerId) {
    return `${baseUrl}/music/${DEFAULT_BOARD}/grade/${params.grade}/learner/${params.learnerId}`;
  } else if (params.grade && params.module) {
    return `${baseUrl}/music/${DEFAULT_BOARD}/grade/${params.grade}/${params.module}`;
  } else if (params.grade) {
    return `${baseUrl}/music/${DEFAULT_BOARD}/grade/${params.grade}`;
  }
  
  return `${baseUrl}/music`;
};

/**
 * Get page title based on navigation parameters
 */
export const getPageTitle = (params: NavigationParams): string => {
  let title = 'PowerParent';
  
  // Handle sharing URLs
  if (params.sharingTab) {
    if (params.sharingTab === 'students') {
      title = 'Share Student Progress - My Learners | PowerParent';
    } else if (params.sharingTab === 'pendingapproval') {
      title = 'Share Student Progress - Pending Approvals | PowerParent';
    } else if (params.sharingTab === 'myconnections') {
      title = 'My Connections - Connected Users | PowerParent';
    } else {
      title = 'Student Progress Sharing | PowerParent';
    }
    return title;
  }
  
  // Handle Post Grade 8
  if (params.isPostGrade8) {
    title = 'Post Grade 8 Music Practice';
    
    if (params.module) {
      const moduleName = params.module.charAt(0).toUpperCase() + params.module.slice(1);
      title += ` - ${moduleName}`;
    }
    
    title += ' | PowerParent';
    return title;
  }
  
  if (params.grade !== undefined) {
    title = `ABRSM Grade ${params.grade}`;
    
    if (params.module) {
      const moduleName = params.module.charAt(0).toUpperCase() + params.module.slice(1);
      title += ` ${moduleName}`;
    }
    
    if (params.learnerId) {
      title += ` - Student Progress`;
    }
    
    title += ' | PowerParent';
  }
  
  return title;
};

/**
 * Extract grade and learner ID from the current URL pathname
 */
export const getGradeAndLearnerFromUrl = (pathname: string): { urlGrade?: number; urlLearnerId?: string } => {
  const gradeMatch = pathname.match(/\/grade\/(\d+)/);
  const learnerMatch = pathname.match(/\/learner\/([^\/]+)/);

  return {
    urlGrade: gradeMatch ? parseInt(gradeMatch[1]) : undefined,
    urlLearnerId: learnerMatch ? learnerMatch[1] : undefined
  };
};

/**
 * Get meta description based on navigation parameters
 */
export const getMetaDescription = (params: NavigationParams): string => {
  // Handle sharing URLs
  if (params.sharingTab) {
    if (params.sharingTab === 'students') {
      return 'Manage and share your learner profiles with connected users. Create learners and control who has access to their music practice progress.';
    } else if (params.sharingTab === 'pendingapproval') {
      return 'Review and approve pending requests from teachers and family members who want to view student practice progress.';
    } else if (params.sharingTab === 'myconnections') {
      return 'View and manage your connections with other users. Connect with teachers, parents, and students to build your network.';
    }
    return 'Share student music practice progress with teachers, family members, and caregivers. Secure and controlled access sharing system.';
  }
  
  // Handle Post Grade 8
  if (params.isPostGrade8) {
    let description = 'Advanced music practice for post-Grade 8 students';
    
    if (params.module) {
      const moduleName = params.module.charAt(0).toUpperCase() + params.module.slice(1);
      description += ` including ${moduleName.toLowerCase()}`;
    }
    
    description += '. Perfect for advanced music students and teachers.';
    return description;
  }
  
  if (params.grade !== undefined) {
    let description = `Track ABRSM Grade ${params.grade} music practice`;
    
    if (params.module) {
      const moduleName = params.module.charAt(0).toUpperCase() + params.module.slice(1);
      description += ` including ${moduleName.toLowerCase()}`;
    }
    
    if (params.learnerId) {
      description += `. Monitor individual learner progress and practice tracking.`;
    } else {
      description += `. Comprehensive practice tracker for all students.`;
    }
    
    return description;
  }
  
  return 'Track ABRSM music practice including scales, pieces, sight reading, and aural tests. Perfect for music students and teachers.';
}; 