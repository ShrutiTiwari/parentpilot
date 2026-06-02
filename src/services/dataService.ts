import { Event } from '@/utils/dateGrouping';
import { Activity } from '@/utils/activityTypes';
import { WeekendPlan } from '@/utils/weekendPlanTypes';
import { supabase } from '@/lib/supabase';
import { getCategoriesByEventType } from '../utils/categoryUtils';
import { API_ENDPOINTS } from '@/config/api';

export const dataService = {
  async getSchoolEventsFromFilesystem(schoolName: string): Promise<Event[]> {
    try {
      // Sanitize school name for filesystem
      const sanitizedSchoolName = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const response = await fetch(`/data/schools/${sanitizedSchoolName}/oneOffEvents.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch events for ${schoolName}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching school events:', error);
      return [];
    }
  },

  async getOneOffEvents(schoolName: string): Promise<Event[]> {
    // This method calls the database service
    return this.getSchoolEventsFromDb(schoolName);
  },

  async getRecurringEvents(childName: string): Promise<Activity[]> {
    try {
      // Sanitize child name for filesystem
      const sanitizedChildName = childName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const response = await fetch(`/data/children/${sanitizedChildName}/recurringEvents.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch recurring events for ${childName}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recurring events:', error);
      return [];
    }
  },

  async getWeekendPlans(childName: string): Promise<WeekendPlan[]> {
    try {
      // Sanitize child name for filesystem
      const sanitizedChildName = childName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const response = await fetch(`/data/children/${sanitizedChildName}/weekendPlans.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch weekend plans for ${childName}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weekend plans:', error);
      return [];
    }
  },

  async getYearGroups(schoolName: string): Promise<string[]> {
    try {
      // Sanitize school name for filesystem
      const sanitizedSchoolName = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const response = await fetch(`/data/schools/${sanitizedSchoolName}/yearGroups.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch year groups for ${schoolName}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching year groups:', error);
      return ['All', 'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    }
  },

  async addEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const res = await fetch(API_ENDPOINTS.events.create, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to create event');
    }
    const data = await res.json();
    const yearGroups = data.year_group
      ? data.year_group.includes(',')
        ? data.year_group.split(',').map((yg: string) => yg.trim())
        : [data.year_group]
      : [];
    return { ...data, yearGroup: data.year_group, yearGroups, todos: data.todos || [] };
  },

  async deleteEvent(eventId: string, userId?: string): Promise<void> {
    const res = await fetch(API_ENDPOINTS.events.delete(eventId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to delete event');
    }
  },

  // Get available categories based on event type
  getEventCategories(eventType: 'school' | 'personal'): string[] {
    return getCategoriesByEventType(eventType).map(category => category.value);
  },

  // Check for duplicate events
  async checkDuplicateEvent(event: Omit<Event, 'id'>): Promise<boolean> {
    try {
      const { title, date, event_type, school_id, created_by_user_id } = event;

      const query = supabase
        .from('events')
        .select('id')
        .eq('title', title)
        .eq('date', date)
        .eq('event_type', event_type);

      // Add appropriate filter based on event type
      if (event_type === 'school') {
        query.eq('school_id', school_id);
      } else {
        query.eq('created_by_user_id', created_by_user_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking for duplicate event:', error);
      return false;
    }
  },

  async updateEvent(event: Event): Promise<Event> {
    const res = await fetch(API_ENDPOINTS.events.update(event.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to update event');
    }
    const data = await res.json();
    const yearGroups = data.year_group
      ? data.year_group.includes(',')
        ? data.year_group.split(',').map((yg: string) => yg.trim())
        : [data.year_group]
      : [];
    return { ...data, yearGroup: data.year_group, yearGroups, todos: data.todos || [] };
  },

  async getSchoolEventsFromDb(schoolName: string): Promise<Event[]> {
    try {
      // Fetch the school ID from the database
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('name', schoolName)
        .single();

      if (schoolError) {
        console.error('Error fetching school:', schoolError);
        throw new Error('NO_EVENTS_DATA');
      }

      if (!school) {
        console.error('School not found:', schoolName);
        throw new Error('NO_EVENTS_DATA');
      }

      // Fetch events for this school from the database
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          todos!fk_todos_event(*)
        `)
        .eq('school_id', school.id)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return [];
      }

      // Map the events to include school_code_required and parse year groups
      const mappedEvents = events.map(ev => {
        // Parse year_group string into an array if it contains commas
        let yearGroups: string[] = [];
        if (ev.year_group) {
          if (ev.year_group.includes(',')) {
            yearGroups = ev.year_group.split(',').map((yg: string) => yg.trim());
          } else {
            yearGroups = [ev.year_group];
          }
        }

        return {
          ...ev,
          yearGroup: ev.year_group,
          yearGroups: yearGroups,
          todos: ev.todos || [],
          school_code_required: ev.school_code_required || false
        };
      });

      return mappedEvents;
    } catch (error) {
      console.error('Error fetching school events from DB:', error);
      if (error.message === 'NO_EVENTS_DATA') {
        throw error;
      }
      return [];
    }
  },

  async getPersonalEvents(userId: string): Promise<Event[]> {
    try {
      // Fetch personal events with their todos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          todos!fk_todos_event(*)
        `)
        .eq('created_by_user_id', userId)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];

      // Convert the events to the expected format
      return events.map(event => {
        // Parse year_group string into an array if it contains commas
        let yearGroups: string[] = [];
        if (event.year_group) {
          if (event.year_group.includes(',')) {
            yearGroups = event.year_group.split(',').map((yg: string) => yg.trim());
          } else {
            yearGroups = [event.year_group];
          }
        }

        return {
          ...event,
          yearGroup: event.year_group,
          yearGroups: yearGroups,
          todos: event.todos || []
        };
      });
    } catch (error) {
      console.error('Error fetching personal events:', error);
      return [];
    }
  }
};
