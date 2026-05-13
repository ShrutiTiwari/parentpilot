import { supabase } from '@/lib/supabase';

/**
 * Service for managing user favorite events
 * Allows each user to have their own set of favorite events
 */

/**
 * Check if specific events are favorited by the current user
 * @param userId - User ID
 * @param eventIds - Array of event IDs to check
 * @returns Array of event IDs that are favorited
 */
export async function getUserFavoriteEventIds(
  userId: string,
  eventIds: number[]
): Promise<number[]> {
  if (!userId || eventIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_favorite_events')
    .select('event_id')
    .eq('user_id', userId)
    .in('event_id', eventIds);

  if (error) {
    console.error('Error fetching user favorites:', error);
    return [];
  }

  return data?.map(f => f.event_id) || [];
}

/**
 * Toggle favorite status for an event
 * @param userId - User ID
 * @param eventId - Event ID
 * @param isFavorite - New favorite status
 */
export async function toggleEventFavorite(
  userId: string,
  eventId: number,
  isFavorite: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isFavorite) {
      // Add favorite
      const { error } = await supabase
        .from('user_favorite_events')
        .insert({ user_id: userId, event_id: eventId });

      if (error) {
        // Ignore unique constraint violation (already favorited)
        if (error.code === '23505') {
          return { success: true };
        }
        console.error('Error adding favorite:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Remove favorite
      const { error } = await supabase
        .from('user_favorite_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error removing favorite:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all favorite events for a user
 * @param userId - User ID
 * @param schoolId - Optional school ID filter
 * @returns Array of events with favorite information
 */
export async function getUserFavoriteEvents(
  userId: string,
  schoolId?: string
) {
  try {
    let query = supabase
      .from('user_favorite_events')
      .select(`
        event_id,
        created_at,
        events (
          id,
          title,
          date,
          time_start,
          time_end,
          year_groups,
          category,
          event_type,
          venue,
          visibility,
          school_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching favorite events:', error);
      return { success: false, error: error.message, data: [] };
    }

    // Filter by school if provided
    let events = data?.map(f => ({
      ...f.events,
      favorited_at: f.created_at
    })) || [];

    if (schoolId) {
      events = events.filter(e => e.school_id === schoolId);
    }

    return { success: true, data: events };
  } catch (error) {
    console.error('Error in getUserFavoriteEvents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

/**
 * Batch insert favorites (used during import)
 * @param userId - User ID
 * @param eventIds - Array of event IDs to favorite
 */
export async function batchInsertFavorites(
  userId: string,
  eventIds: number[]
): Promise<{ success: boolean; error?: string }> {
  if (eventIds.length === 0) {
    return { success: true };
  }

  try {
    const favorites = eventIds.map(eventId => ({
      user_id: userId,
      event_id: eventId
    }));

    const { error } = await supabase
      .from('user_favorite_events')
      .insert(favorites);

    if (error) {
      console.error('Error batch inserting favorites:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in batchInsertFavorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get count of users who favorited each event
 * @param eventIds - Array of event IDs
 * @returns Map of event_id to count
 */
export async function getFavoriteCountsForEvents(
  eventIds: number[]
): Promise<Record<number, number>> {
  if (eventIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('user_favorite_events')
    .select('event_id')
    .in('event_id', eventIds);

  if (error) {
    console.error('Error fetching favorite counts:', error);
    return {};
  }

  // Count occurrences
  const counts: Record<number, number> = {};
  data?.forEach(f => {
    counts[f.event_id] = (counts[f.event_id] || 0) + 1;
  });

  return counts;
}
