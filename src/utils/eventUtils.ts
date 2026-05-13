// Update to add the MegaEvent interface and fix the grouping function

export interface MegaEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  yearGroup: string | string[];
}

export const groupEventsByYearGroup = (events: any[]) => {
  const groupedEvents: Record<string, any[]> = {};
  
  events.forEach(event => {
    if (!event.yearGroup) return;
    
    // Handle yearGroup as either string or string[]
    if (Array.isArray(event.yearGroup)) {
      // If it's an array, add the event to multiple groups
      event.yearGroup.forEach(tag => {
        if (!groupedEvents[tag]) {
          groupedEvents[tag] = [];
        }
        groupedEvents[tag].push(event);
      });
    } else {
      // Handle as a single string
      const tag = event.yearGroup;
      if (!groupedEvents[tag]) {
        groupedEvents[tag] = [];
      }
      groupedEvents[tag].push(event);
    }
  });
  
  return groupedEvents;
};

// Re-export visibility functions from the new utility
export { 
  getEventVisibility, 
  setEventVisibility,
  type EventVisibility 
} from './eventVisibilityUtils';
