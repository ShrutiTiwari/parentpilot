import { supabase } from '../../../lib/supabase';
import { Event } from '../../../utils/dateGrouping';
import { Activity } from '../../../utils/activityTypes';
import { WeekendPlan } from '../../../utils/weekendPlanTypes';
import { IDataService } from '../interfaces/IDataService';
import { FileBasedDataService } from './FileBasedDataService';
import { getEventVisibility, canSeeEvent } from '../../../utils/eventVisibilityUtils';

export class DatabaseDataService implements IDataService {
  private fileBasedService: FileBasedDataService;

  constructor() {
    this.fileBasedService = new FileBasedDataService();
  }

  async getOneOffEvents(schoolName: string): Promise<Event[]> {
    return this.fileBasedService.getOneOffEvents(schoolName);
  }

  async getEventsByYearGroup(yearGroup: string, schoolName: string): Promise<Event[]> {
    return this.fileBasedService.getEventsByYearGroup(yearGroup, schoolName);
  }

  async getRecurringEvents(childName: string): Promise<Activity[]> {
    return this.fileBasedService.getRecurringEvents(childName);
  }

  async getWeekendPlans(childName: string): Promise<WeekendPlan[]> {
    // Placeholder implementation for weekend plans
    return [];
  }

  async getYearGroups(schoolName: string): Promise<string[]> {
    return this.fileBasedService.getYearGroups(schoolName);
  }

  async addEvent(event: Omit<Event, 'id'>): Promise<Event> {
    try {
      // If this is a school event, check admin rights
      if (event.event_type === 'school' && event.school_id) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');
        const { data: adminRow, error: adminError } = await supabase
          .from('school_admins')
          .select('id')
          .eq('user_id', user.id)
          .eq('school_id', event.school_id)
          .single();
        if (adminError || !adminRow) throw new Error('Only school admins can add school events');
      }
      // Insert the event
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: event.title,
          date: event.date,
          time_start: event.time_start || event.time || null,
          time_end: event.time_end || null,
          year_group: event.yearGroup || 'All',
          category: event.category,
          source: event.source || event.sourcePdf || null,
          created_by_user_id: event.created_by_user_id || null,
          school_id: event.school_id || null,
          event_type: event.event_type,
          visibility: getEventVisibility(event) ?? false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Insert todos if any
      if (event.todos && event.todos.length > 0) {
        const todosToInsert = event.todos.map(todo => ({
          event_id: data.id,
          text: todo.text,
          completed: todo.completed,
          created_by_user_id: todo.created_by_user_id || event.created_by_user_id || null,
          todo_type: event.event_type || 'school',
        }));
        console.log('Inserting todos:', todosToInsert);
        const { error: todosError } = await supabase
          .from('todos')
          .insert(todosToInsert);
        if (todosError) {
          console.error('Todos insert error:', todosError);
          throw todosError;
        }
      }

      // Fetch todos for the event
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('event_id', data.id);

      return {
        id: data.id,
        title: data.title,
        date: data.date,
        time_start: data.time_start,
        time_end: data.time_end,
        yearGroup: data.year_group,
        category: data.category,
        source: data.source,
        created_by_user_id: data.created_by_user_id,
        school_id: data.school_id,
        event_type: data.event_type,
        visibility: getEventVisibility(event),
        created_at: data.created_at,
        updated_at: data.updated_at,
        todos: todos || [],
      };
    } catch (error) {
      console.error('Error in addEvent:', error);
      throw error;
    }
  }

  async updateEvent(event: Event): Promise<Event> {
    try {
      // If this is a school event, check admin rights
      if (event.event_type === 'school' && event.school_id) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');
        const { data: adminRow, error: adminError } = await supabase
          .from('school_admins')
          .select('id')
          .eq('user_id', user.id)
          .eq('school_id', event.school_id)
          .single();
        if (adminError || !adminRow) throw new Error('Only school admins can edit school events');
      }
      // Update the event
      const { data, error } = await supabase
        .from('events')
        .update({
          title: event.title,
          date: event.date,
          time_start: event.time_start || event.time || null,
          time_end: event.time_end || null,
          year_group: event.yearGroup || 'All',
          category: event.category,
          source: event.source || event.sourcePdf || null,
          visibility: getEventVisibility(event) ?? false,
        })
        .eq('id', event.id)
        .select()
        .single();

      if (error) throw error;

      // Upsert todos
      if (event.todos) {
        // Fetch existing todos for the event
        const { data: existingTodos } = await supabase
          .from('todos')
          .select('id')
          .eq('event_id', event.id);
        const existingIds = (existingTodos || []).map(t => t.id);
        const incomingIds = event.todos.filter(t => t.id).map(t => t.id);
        // Delete removed todos
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          console.log('Deleting todos:', toDelete);
          await supabase.from('todos').delete().in('id', toDelete);
        }
        // Upsert (insert or update) todos
        for (const todo of event.todos) {
          if (todo.id && existingIds.includes(todo.id)) {
            // Update
            console.log('Updating todo:', todo);
            const { error: updateError } = await supabase.from('todos').update({
              text: todo.text,
              completed: todo.completed,
              todo_type: event.event_type || 'school',
            }).eq('id', todo.id);
            if (updateError) {
              console.error('Todo update error:', updateError);
              throw updateError;
            }
          } else {
            // Insert
            const todoToInsert = {
              event_id: event.id,
              text: todo.text,
              completed: todo.completed,
              created_by_user_id: todo.created_by_user_id || event.created_by_user_id || null,
              todo_type: event.event_type || 'school',
            };
            console.log('Inserting new todo:', todoToInsert);
            const { error: insertError } = await supabase.from('todos').insert(todoToInsert);
            if (insertError) {
              console.error('Todo insert error:', insertError);
              throw insertError;
            }
          }
        }
      }

      // Fetch todos for the event
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('event_id', event.id);

      return {
        ...event,
        ...data,
        todos: todos || [],
      };
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }

  async getSchoolEventsFromDb(schoolName: string): Promise<Event[]> {
    try {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('name', schoolName)
        .single();

      if (!school) {
        console.error('School not found:', schoolName);
        return [];
      }

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          todos (
            id,
            text,
            completed,
            created_by_user_id,
            todo_type
          )
        `)
        .eq('school_id', school.id)
        .eq('event_type', 'school')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching school events:', error);
        return [];
      }

      // Transform events to match the expected format
      return (events || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time_start && event.time_end ? `${event.time_start} - ${event.time_end}` : event.time_start || '',
        time_start: event.time_start,
        time_end: event.time_end,
        venue: event.venue,
        category: event.category,
        yearGroup: event.year_group,
        event_type: event.event_type,
        visibility: getEventVisibility(event),
        todos: event.todos || [],
        sourcePdf: event.source_pdf,
        created_by_user_id: event.created_by_user_id,
        school_id: event.school_id,
        created_at: event.created_at,
        updated_at: event.updated_at
      }));
    } catch (error) {
      console.error('Error in getSchoolEventsFromDb:', error);
      return [];
    }
  }

  async getPersonalEvents(userId: string): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          todos (
            id,
            text,
            completed,
            created_by_user_id,
            todo_type
          )
        `)
        .eq('created_by_user_id', userId)
        .eq('event_type', 'personal')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching personal events:', error);
        return [];
      }

      // Transform events to match the expected format
      return (events || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time_start && event.time_end ? `${event.time_start} - ${event.time_end}` : event.time_start || '',
        time_start: event.time_start,
        time_end: event.time_end,
        venue: event.venue,
        category: event.category,
        yearGroup: event.year_group,
        event_type: event.event_type,
        visibility: getEventVisibility(event),
        todos: event.todos || [],
        sourcePdf: event.source_pdf,
        created_by_user_id: event.created_by_user_id,
        school_id: event.school_id,
        created_at: event.created_at,
        updated_at: event.updated_at
      }));
    } catch (error) {
      console.error('Error in getPersonalEvents:', error);
      return [];
    }
  }
}
