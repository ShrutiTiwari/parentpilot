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
    const res = await fetch(`${API_ENDPOINTS.events.school}?school_name=${encodeURIComponent(schoolName)}`);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error('NO_EVENTS_DATA');
    }
    const { events } = await res.json();
    return (events || []).map((ev: any) => {
      const yearGroups = ev.year_group
        ? ev.year_group.includes(',')
          ? ev.year_group.split(',').map((yg: string) => yg.trim())
          : [ev.year_group]
        : [];
      return { ...ev, yearGroup: ev.year_group, yearGroups, todos: ev.todos || [], school_code_required: ev.school_code_required || false };
    });
  },

  async getPersonalEvents(userId: string): Promise<Event[]> {
    const res = await fetch(`${API_ENDPOINTS.events.personal}?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const { events } = await res.json();
    return (events || []).map((ev: any) => {
      const yearGroups = ev.year_group
        ? ev.year_group.includes(',')
          ? ev.year_group.split(',').map((yg: string) => yg.trim())
          : [ev.year_group]
        : [];
      return { ...ev, yearGroup: ev.year_group, yearGroups, todos: ev.todos || [] };
    });
  }
};
