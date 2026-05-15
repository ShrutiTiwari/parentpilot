import { Event } from '@/utils/dateGrouping';
import { Activity } from '@/utils/activityTypes';
import { WeekendPlan } from '@/utils/weekendPlanTypes';
import { supabase } from '@/lib/supabase';
import { getCategoriesByEventType } from '../utils/categoryUtils';

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
    try {
      console.log('Adding event with todos:', event.todos);
      // Extract todos from the event data
      const { todos, yearGroup, event_type, ...eventData } = event;

      // Convert to snake_case for database
      const eventDataForDb = {
        ...eventData,
        year_group: yearGroup,
        event_type: event_type || 'school', // Default to school if not specified
        school_id: event_type === 'school' ? eventData.school_id : null, // Only set school_id for school events
        created_by_user_id: event_type === 'personal' ? eventData.created_by_user_id : null, // Only set created_by_user_id for personal events
        // Remove any school_id for personal events
        ...(event_type === 'personal' ? { school_id: null } : {}),
        venue: event.venue || null,
        // DB time columns reject empty strings — coerce to null
        time_start: eventData.time_start || null,
        time_end: eventData.time_end || null,
      };

      console.log('Event data for DB:', eventDataForDb);

      // First insert the event
      const { data: insertedEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventDataForDb])
        .select()
        .single();

      if (eventError) throw eventError;

      // If there are todos, insert them with the event_id
      if (todos && todos.length > 0) {
        console.log('Inserting todos:', todos);
        const todosToInsert = todos.map(todo => ({
          event_id: insertedEvent.id,
          text: todo.text,
          completed: todo.completed || false,
          created_by_user_id: todo.created_by_user_id,
          todo_type: event_type || 'school'
        }));

        console.log('Todos to insert:', todosToInsert);
        const { error: todosError } = await supabase
          .from('todos')
          .insert(todosToInsert);

        if (todosError) {
          console.error('Error inserting todos:', todosError);
          // Continue even if todos insertion fails
        }
      }

      // Fetch the event with its todos
      const { data: eventWithTodos, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          todos!fk_todos_event(*)
        `)
        .eq('id', insertedEvent.id)
        .single();

      if (fetchError) throw fetchError;

      console.log('Fetched event with todos:', eventWithTodos);

      // Convert back to camelCase for the frontend
      // Parse year_group string into an array if it contains commas
      let yearGroups: string[] = [];
      if (eventWithTodos.year_group) {
        if (eventWithTodos.year_group.includes(',')) {
          yearGroups = eventWithTodos.year_group.split(',').map((yg: string) => yg.trim());
        } else {
          yearGroups = [eventWithTodos.year_group];
        }
      }

      const eventForFrontend = {
        ...eventWithTodos,
        yearGroup: eventWithTodos.year_group,
        yearGroups: yearGroups,
        todos: eventWithTodos.todos || []
      };

      console.log('Event for frontend:', eventForFrontend);
      return eventForFrontend;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      // First delete all todos associated with the event
      const { error: todosError } = await supabase
        .from('todos')
        .delete()
        .eq('event_id', eventId);

      if (todosError) {
        console.error('Error deleting todos:', todosError);
        throw todosError;
      }

      // Then delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        throw eventError;
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
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
    try {
      // Extract todos from the event data
      const { todos, yearGroup, event_type, ...eventData } = event;

      // Convert to snake_case for database
      const eventDataForDb = {
        ...eventData,
        year_group: yearGroup,
        event_type: event_type || 'school',
        school_id: event_type === 'school' ? eventData.school_id : null,
        created_by_user_id: event_type === 'personal' ? eventData.created_by_user_id : null,
        ...(event_type === 'personal' ? { school_id: null } : {}),
        venue: event.venue || null
      };

      // First update the event
      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(eventDataForDb)
        .eq('id', event.id)
        .select()
        .single();

      if (eventError) throw eventError;

      // Delete existing todos for this event
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) {
        console.error('Error deleting existing todos:', deleteError);
        // Continue even if todo deletion fails
      }

      // If there are todos, insert them with the event_id
      if (todos && todos.length > 0) {
        const todosToInsert = todos.map(todo => ({
          event_id: event.id,
          text: todo.text,
          completed: todo.completed || false,
          created_by_user_id: todo.created_by_user_id || event.created_by_user_id,
          todo_type: event.event_type || 'school'
        }));

        const { error: todosError } = await supabase
          .from('todos')
          .insert(todosToInsert);

        if (todosError) {
          console.error('Error inserting todos:', todosError);
          // Continue even if todos insertion fails
        }
      }

      // Fetch the event with its todos
      const { data: eventWithTodos, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          todos!fk_todos_event(*)
        `)
        .eq('id', event.id)
        .single();

      if (fetchError) throw fetchError;

      // Parse year_group string into an array if it contains commas
      let yearGroups: string[] = [];
      if (eventWithTodos.year_group) {
        if (eventWithTodos.year_group.includes(',')) {
          yearGroups = eventWithTodos.year_group.split(',').map((yg: string) => yg.trim());
        } else {
          yearGroups = [eventWithTodos.year_group];
        }
      }

      return {
        ...eventWithTodos,
        yearGroup: eventWithTodos.year_group,
        yearGroups: yearGroups,
        todos: eventWithTodos.todos || []
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async getSchoolEventsFromDb(schoolName: string): Promise<Event[]> {
    try {
      console.log('Fetching school ID for:', schoolName);
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

      console.log('Found school ID:', school.id);

      // Fetch events for this school from the database
      console.log('Fetching events for school ID:', school.id);
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

      console.log('Fetched events:', events);

      if (!events || events.length === 0) {
        console.log('No events found for school');
        return [];
      }

      // Map the events to include school_code_required and parse year groups
      const mappedEvents = events.map(ev => {
        // Parse year_group string into an array if it contains commas
        let yearGroups: string[] = [];
        if (ev.year_group) {
          if (ev.year_group.includes(',')) {
            // Split comma-separated year groups and trim whitespace
            yearGroups = ev.year_group.split(',').map((yg: string) => yg.trim());
          } else {
            // Single year group
            yearGroups = [ev.year_group];
          }
        }

        return {
          ...ev,
          yearGroup: ev.year_group, // Keep the original string for backward compatibility
          yearGroups: yearGroups,    // Add parsed array for filtering
          todos: ev.todos || [],
          school_code_required: ev.school_code_required || false
        };
      });

      console.log('Mapped events:', mappedEvents);
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
            // Split comma-separated year groups and trim whitespace
            yearGroups = event.year_group.split(',').map((yg: string) => yg.trim());
          } else {
            // Single year group
            yearGroups = [event.year_group];
          }
        }

        return {
          ...event,
          yearGroup: event.year_group, // Keep the original string for backward compatibility
          yearGroups: yearGroups,       // Add parsed array for filtering
          todos: event.todos || []
        };
      });
    } catch (error) {
      console.error('Error fetching personal events:', error);
      return [];
    }
  }
};
