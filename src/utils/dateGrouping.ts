import { format, parse, isValid, parseISO, compareAsc } from 'date-fns';
import { 
  parseDate, 
  formatDate, 
  formatTime, 
  compareDates, 
  getStartOfWeek, 
  getEndOfWeek, 
  formatWeekRange,
  formatMonth,
  formatDay
} from './dateUtils';
import { sortEventsByVisibility } from './eventVisibilityUtils';

export interface TodoItem {
  text: string;
  completed: boolean;
  id: string;
  created_by_user_id?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  yearGroup?: string | string[];
  yearGroups?: string[];
  category?: string;
  sourcePdf?: string;
  todos?: TodoItem[];
  // DB fields for event creation
  time_start?: string;
  time_end?: string;
  source?: string;
  venue?: string;
  created_by_user_id?: string;
  school_id?: string;
  event_type?: 'school' | 'personal';
  visibility?: 'public' | 'private' | 'verified_shared';
  created_at?: string;
  updated_at?: string;
  // User-specific favorite status
  isFavorite?: boolean;
  // Child profile information (for combined view)
  childProfileName?: string;
  childProfileId?: string;
}

export interface EventGroup {
  date: string;
  events: Event[];
}

export interface DayEvents {
  date: string;
  formattedDate: string;
  events: Event[];
}

export interface WeekEvents {
  weekStart: string;
  formattedWeekRange: string;
  days: DayEvents[];
}

export interface MonthEvents {
  month: string;
  formattedMonth: string;
  weeks: WeekEvents[];
}

// Format a date string for display
export function formatEventDate(dateStr: string): string {
  return formatDate(dateStr, { includeYear: true });
}

// Format event time for display
export function formatEventTime(dateStr: string): string {
  return formatTime(dateStr);
}

// Group events by date
export function groupEventsByDate(events: Event[]): EventGroup[] {
  // Create a map to group events by date
  const eventsMap = new Map<string, Event[]>();
  
  events.forEach(event => {
    if (!event.date) return;
    
    if (!eventsMap.has(event.date)) {
      eventsMap.set(event.date, []);
    }
    eventsMap.get(event.date)?.push(event);
  });
  
  // Convert map to array and sort by date
  return Array.from(eventsMap.entries())
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => compareDates(a.date, b.date));
}

// Group events by month and week
export function groupEventsByMonthAndWeek(events: Event[]): MonthEvents[] {
  const monthMap: Record<string, { month: string; events: Event[] }> = {};

  events.forEach(event => {
    const date = parseDate(event.date);
    if (!date) return;
    
    const month = format(date, 'yyyy-MM');

    if (!monthMap[month]) {
      monthMap[month] = { month, events: [] };
    }
    // Preserve all event properties including todos
    monthMap[month].events.push({...event});
  });

  const months = Object.values(monthMap).sort((a, b) =>
    compareDates(a.month + '-01', b.month + '-01')
  );

  const monthEvents = months.map(({ month, events }) => {
    const weekMap: Record<string, Event[]> = {};

    events.forEach(event => {
      const date = parseDate(event.date);
      if (!date) return;
      
      const weekStart = format(getStartOfWeek(date, 1), 'yyyy-MM-dd');

      if (!weekMap[weekStart]) {
        weekMap[weekStart] = [];
      }
      // Preserve all event properties including todos
      weekMap[weekStart].push({...event});
    });

    const weeks = Object.entries(weekMap).sort((a, b) =>
      compareDates(a[0], b[0])
    );

    const weekEvents = weeks.map(([weekStart, events]) => {
      const dayMap: Record<string, Event[]> = {};

      events.forEach(event => {
        const date = parseDate(event.date);
        if (!date) return;
        
        const day = format(date, 'yyyy-MM-dd');
        if (!dayMap[day]) {
          dayMap[day] = [];
        }
        // Preserve all event properties including todos
        dayMap[day].push({...event});
      });

      const days = Object.entries(dayMap).sort((a, b) =>
        compareDates(a[0], b[0])
      );

      const dayEvents = days.map(([date, events]) => ({
        date,
        formattedDate: formatDay(date),
        events: sortEventsByVisibility(events.map(e => ({...e}))) // Sort events by visibility within each day
      }));

      const weekStartDate = parseDate(weekStart);
      const weekEndDate = weekStartDate ? getEndOfWeek(weekStartDate, 1) : new Date();
      const formattedWeekRange = formatWeekRange(weekStartDate || new Date(), weekEndDate);

      return {
        weekStart,
        formattedWeekRange,
        days: dayEvents
      };
    });

    const formattedMonth = formatMonth(month + '-01');

    return {
      month,
      formattedMonth,
      weeks: weekEvents
    };
  });

  return monthEvents;
}
