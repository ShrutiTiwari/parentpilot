import React from 'react';
import { 
  Music4, 
  Volleyball, 
  Fish, 
  Theater, 
  CheckSquare, 
  VenetianMask, 
  Sparkles, 
  PartyPopper,
  Users
} from "lucide-react";
import { getEventStyle } from './categoryStyles';

export interface CategoryConfig {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  eventType: 'school' | 'personal' | 'both';
}

export interface CategoryIconProps {
  category: string;
  className?: string;
}

// All available categories with their configurations
export const CATEGORIES: CategoryConfig[] = [
  // School categories
  { value: 'general', label: 'General', icon: Sparkles, eventType: 'school' },
  { value: 'music', label: 'Music', icon: Music4, eventType: 'both' },
  { value: 'sports', label: 'Sports', icon: Volleyball, eventType: 'both' },
  { value: 'swimming', label: 'Swimming', icon: Fish, eventType: 'both' },
  { value: 'drama', label: 'Drama', icon: Theater, eventType: 'school' },
  { value: 'dance', label: 'Dance', icon: VenetianMask, eventType: 'school' },
  { value: 'trip', label: 'Trip', icon: Sparkles, eventType: 'school' },
  { value: 'club', label: 'Club', icon: Sparkles, eventType: 'school' },
  { value: 'meeting', label: 'Meeting', icon: Sparkles, eventType: 'school' },
  { value: 'holiday', label: 'Holiday', icon: Sparkles, eventType: 'school' },
  { value: 'parents', label: 'Parents', icon: Users, eventType: 'school' },
  { value: 'academic', label: 'Academic', icon: Sparkles, eventType: 'school' },
  { value: 'test', label: 'Test', icon: Sparkles, eventType: 'school' },
  { value: 'competition', label: 'Competition', icon: Sparkles, eventType: 'school' },
  { value: 'other', label: 'Other', icon: Sparkles, eventType: 'school' },
  
  // Personal categories
  { value: 'birthday', label: 'Birthday', icon: PartyPopper, eventType: 'personal' },
  { value: 'appointment', label: 'Appointment', icon: Sparkles, eventType: 'personal' },
  { value: 'family', label: 'Family', icon: Users, eventType: 'personal' },
];

// Special categories
export const SPECIAL_CATEGORIES = {
  HAS_TODOS: 'HasToDos',
  PRIVATE: 'private',
  PUBLIC: 'public',
  VERIFIED_SHARED: 'verified_shared'
} as const;

// Get categories by event type
export const getCategoriesByEventType = (eventType: 'school' | 'personal'): CategoryConfig[] => {
  return CATEGORIES.filter(category => 
    category.eventType === eventType || category.eventType === 'both'
  );
};

// Get category icon component
export const getCategoryIcon = (category: string): React.ComponentType<{ className?: string }> | null => {
  const categoryConfig = CATEGORIES.find(cat => cat.value === category);
  return categoryConfig?.icon || null;
};

// Get category label
export const getCategoryLabel = (category: string): string => {
  if (category === SPECIAL_CATEGORIES.HAS_TODOS) {
    return 'Has Tasks';
  }
  
  const categoryConfig = CATEGORIES.find(cat => cat.value === category);
  return categoryConfig?.label || category.charAt(0).toUpperCase() + category.slice(1);
};

// Get category options for select dropdowns
export const getCategoryOptions = (eventType: 'school' | 'personal'): { value: string; label: string }[] => {
  return getCategoriesByEventType(eventType).map(category => ({
    value: category.value,
    label: category.label
  }));
};

// Get available categories from events (for filters)
export const getAvailableCategoriesFromEvents = (events: any[]): string[] => {
  const uniqueCategories = new Set(events.map(event => event.category).filter(Boolean));
  const allCategories = [SPECIAL_CATEGORIES.HAS_TODOS, ...Array.from(uniqueCategories)];
  
  // Categories with icons (should appear first)
  const categoriesWithIcons = [SPECIAL_CATEGORIES.HAS_TODOS, 'music', 'sports', 'swimming', 'drama'];
  
  // Sort categories: those with icons first, then the rest
  return allCategories.sort((a, b) => {
    const aHasIcon = categoriesWithIcons.includes(a);
    const bHasIcon = categoriesWithIcons.includes(b);
    
    if (aHasIcon && !bHasIcon) return -1;
    if (!aHasIcon && bHasIcon) return 1;
    
    // If both have icons or both don't have icons, sort alphabetically
    return a.localeCompare(b);
  });
};

// Get category style (re-export from categoryStyles for convenience)
export const getCategoryStyle = getEventStyle; 