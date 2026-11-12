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
  Users,
  Stethoscope,
  FileEdit,
  School,
  BookOpen,
  Trophy,
  UsersRound,
  FileText,
  CircleDot
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

// All available categories with their configurations.
//
// This used to drift out of sync with the category dropdowns in
// EventDialog.tsx/AgentReviewCard.tsx (two more hand-written lists) — e.g.
// "Birthday" existed here but was never selectable in either dropdown, and
// this list used "test" where the dropdowns used "exam" for the same thing.
// Those two dropdowns now derive their options from this list directly (see
// getCategoryOptionsWithEmoji below) instead of maintaining their own, so
// there's one place to add/rename a category going forward.
//
// Several categories below previously reused the generic Sparkles icon —
// given real icons here so they're visually distinct, matching the
// dedicated colors added in categoryStyles.ts for the same reason.
export const CATEGORIES: CategoryConfig[] = [
  // School categories
  { value: 'general', label: 'General', icon: Sparkles, eventType: 'school' },
  { value: 'music', label: 'Music', icon: Music4, eventType: 'both' },
  { value: 'sports', label: 'Sports', icon: Volleyball, eventType: 'both' },
  { value: 'swimming', label: 'Swimming', icon: Fish, eventType: 'both' },
  { value: 'drama', label: 'Drama', icon: Theater, eventType: 'school' },
  { value: 'dance', label: 'Dance', icon: VenetianMask, eventType: 'school' },
  { value: 'trip', label: 'Trip', icon: Sparkles, eventType: 'school' },
  { value: 'club', label: 'Club', icon: School, eventType: 'school' },
  { value: 'meeting', label: 'Meeting', icon: Users, eventType: 'school' },
  { value: 'holiday', label: 'Holiday', icon: Sparkles, eventType: 'school' },
  { value: 'parents', label: 'Parents', icon: UsersRound, eventType: 'school' },
  { value: 'academic', label: 'Academic', icon: BookOpen, eventType: 'school' },
  { value: 'exam', label: 'Exam', icon: FileEdit, eventType: 'school' },
  { value: 'competition', label: 'Competition', icon: Trophy, eventType: 'school' },
  { value: 'report', label: 'Report', icon: FileText, eventType: 'school' },
  { value: 'other', label: 'Other', icon: CircleDot, eventType: 'school' },

  // Personal categories
  { value: 'birthday', label: 'Birthday', icon: PartyPopper, eventType: 'personal' },
  { value: 'medical', label: 'Medical', icon: Stethoscope, eventType: 'personal' },
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

// Emoji per category, for the native <select> dropdowns in EventDialog.tsx
// and AgentReviewCard.tsx — a plain <option> can't render a React icon
// component, so those dropdowns show an emoji-prefixed label instead. Kept
// here, next to CATEGORIES, so adding a category only means editing one
// place rather than three.
const CATEGORY_EMOJI: Record<string, string> = {
  sports: '🏅', swimming: '🏊', music: '🎵', drama: '🎭', dance: '💃',
  exam: '📝', trip: '🚌', club: '🏫', meeting: '🗣️', academic: '📚',
  competition: '🏆', parents: '👨‍👩‍👧', holiday: '🏖️', report: '📄',
  medical: '🏥', birthday: '🎂', appointment: '📅', family: '👪',
  other: '🔹', general: '📌',
};

// All categories (school + personal) as emoji-labelled options, for a flat
// dropdown that isn't filtered by event type — both EventDialog.tsx and
// AgentReviewCard.tsx show one combined list rather than switching options
// based on the personal/school toggle, so this doesn't use
// getCategoriesByEventType's split. "general" is always listed last to
// match the existing convention of "catch-all sits at the bottom".
export const getAllCategoryOptionsWithEmoji = (): { value: string; label: string }[] => {
  const ordered = [...CATEGORIES.filter(c => c.value !== 'general'), ...CATEGORIES.filter(c => c.value === 'general')];
  return ordered.map(category => ({
    value: category.value,
    label: `${CATEGORY_EMOJI[category.value] || '📌'} ${category.label}`,
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