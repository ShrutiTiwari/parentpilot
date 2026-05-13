import { Lock, Users, Globe, Eye } from 'lucide-react';
import { Event as BaseEvent } from './dateGrouping';

export type EventVisibility = 'public' | 'private' | 'verified_shared';

export interface EventVisibilityConfig {
  value: EventVisibility;
  label: string;
  description: string;
  icon: any; // React component type
  emoji: string; // Emoji icon
  iconColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

// Use type alias to avoid circular dependency
export type Event = BaseEvent & {
  visibility?: EventVisibility | null;
  event_type?: 'school' | 'personal';
};

// Visibility configurations
export const EVENT_VISIBILITY_CONFIGS: Record<EventVisibility, EventVisibilityConfig> = {
  private: {
    value: 'private',
    label: 'Private',
    description: 'Only visible to you',
    icon: Lock,
    emoji: '🔒',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700'
  },
  verified_shared: {
    value: 'verified_shared',
    label: 'Shared with Verified Parents',
    description: 'Only visible to parents who have entered the school code',
    icon: Users,
    emoji: '👥',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  },
  public: {
    value: 'public',
    label: 'Public',
    description: 'Visible to everyone. Data is on school public website.',
    icon: Globe,
    emoji: '🌍',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900'
  }
};

// Get event visibility with fallback
export function getEventVisibility(event: BaseEvent): EventVisibility {
  return (event as Event).visibility || 'private';
}

// Set event visibility
export function setEventVisibility(event: any, visibility: EventVisibility) {
  (event as Event).visibility = visibility;
  return event;
}

// Get visibility configuration
export function getVisibilityConfig(visibility: EventVisibility): EventVisibilityConfig {
  return EVENT_VISIBILITY_CONFIGS[visibility];
}

// Get visibility icon component
export function getVisibilityIcon(visibility: EventVisibility): any {
  return getVisibilityConfig(visibility).icon;
}

// Get visibility emoji
export function getVisibilityEmoji(visibility: EventVisibility): string {
  return getVisibilityConfig(visibility).emoji;
}

// Get visibility label
export function getVisibilityLabel(visibility: EventVisibility): string {
  return getVisibilityConfig(visibility).label;
}

// Get visibility description
export function getVisibilityDescription(visibility: EventVisibility): string {
  return getVisibilityConfig(visibility).description;
}

// Check if event is public
export function isPublicEvent(event: BaseEvent): boolean {
  return getEventVisibility(event) === 'public';
}

// Check if event is private
export function isPrivateEvent(event: BaseEvent): boolean {
  return getEventVisibility(event) === 'private';
}

// Check if event is verified shared
export function isVerifiedSharedEvent(event: BaseEvent): boolean {
  return getEventVisibility(event) === 'verified_shared';
}

// Check if user can edit event (private events or school admin)
export function canEditEvent(event: BaseEvent, isSchoolAdmin: boolean = false): boolean {
  const visibility = getEventVisibility(event);
  return visibility === 'private' || isSchoolAdmin;
}

// Check if user can see event (has access or is public)
export function canSeeEvent(event: BaseEvent, hasAccess: boolean): boolean {
  return hasAccess || isPublicEvent(event);
}

// Get visibility icon component with tooltip props
export function getVisibilityIconWithTooltip(visibility: EventVisibility) {
  const config = getVisibilityConfig(visibility);
  return {
    icon: config.icon,
    emoji: config.emoji,
    iconColor: config.iconColor,
    tooltipText: config.description
  };
}

// Get all visibility options for dropdowns/radio groups
export function getVisibilityOptions(): Array<{ value: EventVisibility; label: string; description: string; emoji: string }> {
  return Object.values(EVENT_VISIBILITY_CONFIGS).map(config => ({
    value: config.value,
    label: config.label,
    description: config.description,
    emoji: config.emoji
  }));
}

// Get visibility options for school events (excludes private for non-admins)
export function getSchoolEventVisibilityOptions(isAdmin: boolean = false): Array<{ value: EventVisibility; label: string; description: string; emoji: string }> {
  if (isAdmin) {
    return getVisibilityOptions();
  }
  
  // Non-admins can only create public or verified_shared events
  return [
    EVENT_VISIBILITY_CONFIGS.public,
    EVENT_VISIBILITY_CONFIGS.verified_shared
  ].map(config => ({
    value: config.value,
    label: config.label,
    description: config.description,
    emoji: config.emoji
  }));
}

// Get default visibility for event type
export function getDefaultVisibility(eventType: 'school' | 'personal'): EventVisibility {
  return eventType === 'personal' ? 'private' : 'public';
}

// Check if visibility is valid for event type
export function isValidVisibilityForEventType(visibility: EventVisibility, eventType: 'school' | 'personal'): boolean {
  if (eventType === 'personal') {
    return visibility === 'private';
  }
  
  // School events can have any visibility
  return true;
}

// Sort events by visibility priority: private first, then shared, then public
export function sortEventsByVisibility(events: BaseEvent[]): BaseEvent[] {
  return [...events].sort((a, b) => {
    const visibilityA = getEventVisibility(a as Event);
    const visibilityB = getEventVisibility(b as Event);
    
    // Define priority order: private (0), verified_shared (1), public (2)
    const priorityMap: Record<EventVisibility, number> = {
      private: 0,
      verified_shared: 1,
      public: 2
    };
    
    return priorityMap[visibilityA] - priorityMap[visibilityB];
  });
}

// Get appropriate visibility for cloned events
export function getClonedEventVisibility(
  originalEvent: any, 
  isAdmin: boolean = false
): EventVisibility {
  // If it's a personal event, always private
  if (originalEvent.event_type === 'personal') {
    return 'private';
  }
  
  // If it's a school event
  if (originalEvent.event_type === 'school') {
    // If user is admin, keep original visibility
    if (isAdmin) {
      return originalEvent.visibility || 'public';
    }
    // If user is non-admin, force to private
    return 'private';
  }
  
  // Default fallback
  return 'private';
} 