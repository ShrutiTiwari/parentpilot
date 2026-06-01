import { useState, useEffect } from 'react';
import { Event, TodoItem } from '../utils/dateGrouping';
import { useChildProfiles } from '../contexts/ChildProfileContext';
import { useSchoolAuthorizations } from '../contexts/SchoolAuthorizationContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { dataService } from '../services/dataService';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventVisibility, canSeeEvent } from '../utils/eventVisibilityUtils';
import { convertToInputFormat, parseTimeForInput } from '../utils/dateUtils';
import { convertYearGroupsToDatabase, getYearGroupsFromDatabase, parseCompoundYearGroups } from '@/utils/yearGroupUtils';
import { getUserFavoriteEventIds, toggleEventFavorite } from '@/services/userFavoritesService';

interface ExtractedEventData {
  title: string;
  date: string;
  category: string;
  yearGroup: string;
  event_type: 'school' | 'personal';
  visibility: 'private' | 'public' | 'verified_shared';
  time_start: string;
  time_end: string;
  venue: string;
  todos: TodoItem[];
  created_by_user_id: string | null;
  school_id: string | null;
}

export function useEventManagement(showAuthModal?: boolean, setShowAuthModal?: (show: boolean, action: string) => void) {
  const { selectedProfile, profiles } = useChildProfiles();
  const { authorizedSchools } = useSchoolAuthorizations();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  const isAdmin = selectedProfile && authorizedSchools.some(
    auth => auth.schools?.id === selectedProfile.schoolId
  );

  // Dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showAiWarning, setShowAiWarning] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    category: '',
    yearGroup: '',
    event_type: 'school',
    visibility: 'private' as 'public' | 'private' | 'verified_shared',
    time_start: '',
    time_end: '',
    venue: '',
    todos: [],
    created_by_user_id: null as string | null,
    school_id: null as string | null
  });

  // Check if user has access to the selected school
  // Only show school access if a child profile is selected
  const hasSchoolAccess = selectedProfile ? authorizedSchools.some(
    auth => auth.schools?.name === selectedProfile.schoolName
  ) : false;

  // Load pending event data from localStorage on mount
  useEffect(() => {
    const savedEventData = localStorage.getItem('pendingEventData');
    if (savedEventData) {
      try {
        JSON.parse(savedEventData);
      } catch (error) {
        console.error('Error parsing saved event data:', error);
        localStorage.removeItem('pendingEventData');
      }
    }
  }, []);

  // Persist local events to database after authentication
  useEffect(() => {
    if (user) {
      const savedEventData = localStorage.getItem('pendingEventData');
      if (savedEventData) {
        const persistLocalEvents = async () => {
          try {
            const pendingEvents = JSON.parse(savedEventData);

            let successCount = 0;
            let errorCount = 0;

            for (const eventData of pendingEvents) {
              try {
                // Validate required fields
                if (!eventData.title || !eventData.date) {
                  errorCount++;
                  continue;
                }

                // Convert year groups to database format
                const yearGroups = eventData.yearGroup ? eventData.yearGroup.split(',').map((yg: string) => yg.trim()).filter(Boolean) : [];
                const yearGroupData = convertYearGroupsToDatabase(yearGroups);

                // Prepare event data for database - all local events are personal
                const eventToSave = {
                  title: eventData.title,
                  date: eventData.date,
                  category: eventData.category || 'general',
                  yearGroup: yearGroupData.year_group || 'All',
                  event_type: 'personal' as const,
                  visibility: 'private' as const,
                  time_start: eventData.time_start || null,
                  time_end: eventData.time_end || null,
                  venue: eventData.venue || null,
                  created_by_user_id: user.id,
                  school_id: null,
                  todos: eventData.todos?.map((todo: any) => ({
                    text: todo.text,
                    completed: todo.completed || false,
                    created_by_user_id: user.id,
                    todo_type: 'personal'
                  })) || []
                };

                await dataService.addEvent(eventToSave);
                successCount++;

              } catch (eventError) {
                console.error('Error persisting individual event:', eventError);
                errorCount++;
              }
            }

            // Clear localStorage after processing all events
            localStorage.removeItem('pendingEventData');

            // Refresh the events data
            queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
            queryClient.invalidateQueries({ queryKey: ['personalEvents'] });

            // Show appropriate message based on results
            if (successCount > 0 && errorCount === 0) {
              toast({
                title: 'Events synced!',
                description: `All ${successCount} events have been synced to your account.`,
                variant: 'default'
              });
            } else if (successCount > 0 && errorCount > 0) {
              toast({
                title: 'Partial sync completed',
                description: `${successCount} events synced, ${errorCount} events could not be synced.`,
                variant: 'default'
              });
            } else if (successCount === 0 && errorCount > 0) {
              toast({
                title: 'Sync failed',
                description: `${errorCount} events could not be synced. Please try again later.`,
                variant: 'destructive'
              });
            }

          } catch (error) {
            console.error('Error persisting local events:', error);
            toast({
              title: 'Sync failed',
              description: 'Could not sync your local events. Please try again later.',
              variant: 'destructive'
            });
          }
        };

        // Add a small delay to ensure auth state is fully settled
        setTimeout(persistLocalEvents, 500);
      }
    }
  }, [user, selectedProfile, queryClient, toast]);

  // React Query for fetching school events
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ['schoolEvents', selectedProfile?.schoolName, authorizedSchools.length, user?.id, selectedProfile?.id, profiles.length],
    queryFn: async () => {
      let schoolEvents: any[] = [];

      if (user) {
        if (selectedProfile) {
          // Get events for the selected child's school
          schoolEvents = await dataService.getSchoolEventsFromDb(selectedProfile.schoolName);
          schoolEvents = schoolEvents.filter(event => canSeeEvent(event, hasSchoolAccess));

          // Add child profile info to each event
          schoolEvents = schoolEvents.map(event => ({
            ...event,
            childProfileName: selectedProfile.name,
            childProfileId: selectedProfile.id
          }));
        } else {
          // No profile selected - get events from ALL children's schools
          if (profiles && profiles.length > 0) {
            const allSchoolEvents: any[] = [];

            // Get unique schools to avoid duplicates
            const uniqueSchools = new Map<string, any>();
            profiles.forEach(profile => {
              if (profile.schoolName && !uniqueSchools.has(profile.schoolName)) {
                uniqueSchools.set(profile.schoolName, profile);
              }
            });

            // Fetch events from each unique school
            for (const [schoolName, profile] of uniqueSchools) {
              try {
                const eventsForSchool = await dataService.getSchoolEventsFromDb(schoolName);
                const visibleEvents = eventsForSchool.filter(event => {
                  // Check if user has access to this school
                  const hasAccess = authorizedSchools.some(
                    auth => auth.schools?.name === schoolName
                  );
                  return canSeeEvent(event, hasAccess);
                });

                // Add child profile info for each event
                const eventsWithProfile = visibleEvents.map(event => ({
                  ...event,
                  childProfileName: profile.name,
                  childProfileId: profile.id
                }));

                allSchoolEvents.push(...eventsWithProfile);
              } catch (error) {
                console.error(`Error fetching events for school ${schoolName}:`, error);
              }
            }

            schoolEvents = allSchoolEvents;
          }
        }

        // Load user's favorites and mark events
        if (schoolEvents.length > 0) {
          const eventIds = schoolEvents.map(e => parseInt(e.id)).filter(id => !isNaN(id));
          const favoriteIds = await getUserFavoriteEventIds(user.id, eventIds);

          // Mark events as favorited
          schoolEvents = schoolEvents.map(event => ({
            ...event,
            isFavorite: favoriteIds.includes(parseInt(event.id))
          }));
        }
      }

      return schoolEvents;
    },
    enabled: !!user,
  });

  // React Query for fetching personal events
  const { data: personalEvents = [] } = useQuery({
    queryKey: ['personalEvents', user?.id],
    queryFn: async () => {
      let personalEvents: any[] = [];

      // Get events from database if user is authenticated
      if (user) {
        personalEvents = await dataService.getPersonalEvents(user.id);
      }

      // Add local events if user is not authenticated (all local events are personal)
      if (!user) {
        const savedEventData = localStorage.getItem('pendingEventData');
        if (savedEventData) {
          try {
            const localEvents = JSON.parse(savedEventData);
            personalEvents = [...personalEvents, ...localEvents];
          } catch (error) {
            console.error('Error parsing local events:', error);
          }
        }
      }

      return personalEvents;
    },
    enabled: true, // Always enabled to show local events even when not authenticated
  });

  // Extract unique year groups from events
  const yearGroups = ['All', ...Array.from(new Set(events.map(event => event.yearGroup).filter(Boolean)))];

  // Mutation for adding/updating events
  const eventMutation = useMutation({
    mutationFn: async (eventToSave: any) => {
      if (editingEvent) {
        return dataService.updateEvent({ ...eventToSave, id: editingEvent.id } as Event);
      } else {
        return dataService.addEvent(eventToSave);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
      queryClient.invalidateQueries({ queryKey: ['personalEvents'] });

      // Only close the dialog if we're not dealing with extracted events
      // The EventDialog component will handle closing when all extracted events are saved
      if (extractedEvents.length === 0) {
        setShowEventDialog(false);
      }

      toast({
        title: editingEvent ? 'Event updated!' : 'Event saved!',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      let description = error.message;
      if (
        error.message?.includes('unique_personal_event') ||
        error.message?.includes('duplicate key value')
      ) {
        description = 'You already have a personal event with this title and date. Please choose a different title or date.';
      }
      toast({
        title: 'Error saving event',
        description,
        variant: 'destructive'
      });
    }
  });

  // Mutation for deleting events
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return dataService.deleteEvent(eventId, user?.id);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
      queryClient.invalidateQueries({ queryKey: ['personalEvents'] });
      toast({
        title: 'Event deleted!',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting event',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const [extractedEvents, setExtractedEvents] = useState<ExtractedEventData[]>([]);
  const [currentExtractedEventIndex, setCurrentExtractedEventIndex] = useState(0);

  const handleExtractSuccess = (extractedData: any) => {
    // Check if extractedData is an array (multiple events) or a single event
    const eventsArray = Array.isArray(extractedData) ? extractedData : [extractedData];

    // Process and format all events
    const formattedEvents = eventsArray.map((event: any) => {
      // Parse and format the date
      const formattedDate = event.date ? convertToInputFormat(event.date) : '';

      // Support both snake_case (new unified prompt) and camelCase (legacy)
      const yearGroup = event.year_group || event.yearGroup || '';

      // New prompt returns actions [{text, deadline}]; legacy returned todos [{id, text, completed}]
      // Normalise to the shape the rest of the app expects
      const todos = event.actions
        ? event.actions.map((a: any) => ({ text: a.text, completed: false, deadline: a.deadline || null }))
        : (event.todos || []);

      return {
        title: event.title || '',
        date: formattedDate,
        category: event.category || '',
        yearGroup,
        event_type: event.event_type || 'school',
        visibility: event.visibility || 'private',
        time_start: event.time_start ? parseTimeForInput(event.time_start) : '',
        time_end: event.time_end ? parseTimeForInput(event.time_end) : '',
        venue: event.venue || '',
        description: event.description || '',
        todos,
        created_by_user_id: user?.id || null,
        school_id: selectedProfile?.schoolId || null
      };
    });

    // Set the extractedEvents to the full array
    setExtractedEvents(formattedEvents);

    // Set the first event as the newEvent for the form
    if (formattedEvents.length > 0) {
      setNewEvent(formattedEvents[0]);
    }

    // Show the dialog
    setShowEventDialog(true);
  };

  const handleSaveEvent = async (eventData?: any) => {
    // Use the passed eventData if available, otherwise use newEvent
    const dataToSave = eventData || newEvent;

    // Use the same condition as the sign-out button visibility
    const isUserAuthenticated = !!user;

    // If user is not authenticated, save event locally as personal event and prompt for authentication
    if (!isUserAuthenticated) {
      // Get existing local events
      const existingEvents = localStorage.getItem('pendingEventData');
      const localEvents = existingEvents ? JSON.parse(existingEvents) : [];

      // Clean up event data for local storage - always save as personal event when unauthenticated
      const eventToSaveLocally = {
        title: dataToSave.title || '',
        date: dataToSave.date || '',
        category: dataToSave.category || 'general',
        yearGroup: dataToSave.yearGroup || '',
        event_type: 'personal', // Always personal when unauthenticated
        visibility: 'private', // Always private for personal events
        time_start: dataToSave.time_start || '',
        time_end: dataToSave.time_end || '',
        venue: dataToSave.venue || '',
        todos: dataToSave.todos?.map((todo: any) => ({
          text: todo.text || '',
          completed: todo.completed || false
        })) || [],
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        local: true
      };

      localEvents.push(eventToSaveLocally);
      localStorage.setItem('pendingEventData', JSON.stringify(localEvents));

      // Show auth modal to prompt user to sign in
      if (setShowAuthModal) {
        setShowAuthModal(true, 'save_event');
      }

      // Keep the dialog open so user can see their event
      return;
    }

    setSavingEvent(true);
    try {
      // Convert year groups to database format - just use what's selected in UI
      const yearGroups = dataToSave.yearGroup ? dataToSave.yearGroup.split(',').map((yg: string) => yg.trim()).filter(Boolean) : [];
      const yearGroupData = convertYearGroupsToDatabase(yearGroups);

      // Validate event type - if trying to save school event but no profile selected, convert to personal
      let finalEventType = dataToSave.event_type as 'school' | 'personal';

      // Only convert to personal events if it's a manually created school event without a profile
      // Don't convert extracted events (from term dates) or events that already have a school_id
      const isExtractedEvent = extractedEvents.length > 0;
      const hasSchoolId = dataToSave.school_id;

      if (finalEventType === 'school' && !selectedProfile && !isExtractedEvent && !hasSchoolId) {
        finalEventType = 'personal';
        toast({
          title: 'Event saved as personal',
          description: 'This event was saved as a personal event since no child profile is selected.',
          variant: 'default'
        });
      }

      const eventToSave = {
        ...dataToSave,
        event_type: finalEventType,
        school_id: finalEventType === 'school' ? selectedProfile?.schoolId : null,
        created_by_user_id: user.id,
        ...yearGroupData,
        todos: dataToSave.todos?.map((todo: any) => ({
          ...todo,
          created_by_user_id: user.id,
          todo_type: finalEventType
        })) || []
      };
      await eventMutation.mutateAsync(eventToSave);

      if (extractedEvents.length > 0) {
        // Extracted event saved — dialog stays open for remaining events
      } else {
        // Manually added event — clear and close
        setExtractedEvents([]);
        setCurrentExtractedEventIndex(0);

        setNewEvent({
          title: '',
          date: '',
          category: '',
          yearGroup: '',
          event_type: 'school',
          visibility: 'private',
          time_start: '',
          time_end: '',
          venue: '',
          todos: [],
          created_by_user_id: user?.id || null,
          school_id: selectedProfile?.schoolId || null
        });
      }
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
    setShowAiWarning(false);

    // Format the date to YYYY-MM-DD if it's not already in that format
    const formattedDate = event.date ? convertToInputFormat(event.date) : '';

    // Get year groups from database format (handles both old and new fields)
    const yearGroups = getYearGroupsFromDatabase(
      typeof event.yearGroup === 'string' ? event.yearGroup : undefined,
      event.yearGroups
    );

    // For the MultiSelect component, join the year groups with commas
    const yearGroupString = yearGroups.join(',');

    setNewEvent({
      title: event.title || '',
      date: formattedDate,
      category: event.category || '',
      yearGroup: yearGroupString,
      event_type: event.event_type || 'school',
      visibility: getEventVisibility(event),
      time_start: event.time_start ? parseTimeForInput(event.time_start) : event.time || '',
      time_end: event.time_end ? parseTimeForInput(event.time_end) : '',
      venue: event.venue || '',
      todos: event.todos ? [...event.todos] : [],
      created_by_user_id: user?.id || null,
      school_id: selectedProfile?.schoolId || null
    });
  };

  // Todo editing logic
  const handleTodoChange = (idx: number, value: string) => {
    setNewEvent(prev => {
      const todos = prev.todos ? [...prev.todos] : [];
      todos[idx].text = value;
      return { ...prev, todos };
    });
  };

  const handleTodoRemove = (idx: number) => {
    setNewEvent(prev => {
      const todos = prev.todos ? [...prev.todos] : [];
      todos.splice(idx, 1);
      return { ...prev, todos };
    });
  };

  const handleTodoAdd = () => {
    setNewEvent(prev => ({
      ...prev,
      todos: [...(prev.todos || []), { id: uuidv4(), text: '', completed: false }]
    }));
  };

  const handleAddEventClick = (eventType: 'school' | 'personal') => {
    setEditingEvent(null);
    setShowAiWarning(false);
    setExtractedEvents([]); // Clear any extracted events when manually adding
    setNewEvent({
      title: '',
      date: '',
      category: '',
      yearGroup: '',
      event_type: eventType,
      visibility: 'private',
      time_start: '',
      time_end: '',
      venue: '',
      todos: [],
      created_by_user_id: user?.id || null,
      school_id: selectedProfile?.schoolId || null
    });
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!event.id) return;

    // Handle local events
    if (typeof event.id === 'string' && event.id.startsWith('local_')) {
      const savedEventData = localStorage.getItem('pendingEventData');
      if (savedEventData) {
        try {
          const localEvents = JSON.parse(savedEventData);
          const updatedEvents = localEvents.filter((e: any) => e.id !== event.id);
          localStorage.setItem('pendingEventData', JSON.stringify(updatedEvents));

          // Invalidate queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
          queryClient.invalidateQueries({ queryKey: ['personalEvents'] });

          toast({
            title: 'Event deleted!',
            description: 'Local event has been removed.',
            variant: 'default'
          });
        } catch (error) {
          console.error('Error deleting local event:', error);
          toast({
            title: 'Error deleting event',
            description: 'Could not delete local event.',
            variant: 'destructive'
          });
        }
      }
      return;
    }

    // Handle database events
    try {
      await deleteMutation.mutateAsync(event.id);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleFavorite = async (eventId: string, isFavorite: boolean) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to favorite events.',
        variant: 'default'
      });
      return;
    }

    const numericEventId = parseInt(eventId);
    if (isNaN(numericEventId)) {
      console.error('Invalid event ID for favorite toggle:', eventId);
      return;
    }

    const result = await toggleEventFavorite(user.id, numericEventId, isFavorite);

    if (result.success) {
      // Invalidate queries to refresh with updated favorites
      queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
      queryClient.invalidateQueries({ queryKey: ['personalEvents'] });

      toast({
        title: isFavorite ? 'Added to favorites' : 'Removed from favorites',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Error updating favorite',
        description: result.error || 'Could not update favorite status.',
        variant: 'destructive'
      });
    }
  };

  return {
    // State
    events,
    personalEvents,
    yearGroups,
    loading,
    showEventDialog,
    editingEvent,
    showAiWarning,
    newEvent,
    savingEvent,
    hasSchoolAccess,
    extractedEvents,
    setExtractedEvents,
    currentExtractedEventIndex,
    showAuthModal,

    // Setters
    setNewEvent,
    setShowEventDialog,

    // Handlers
    handleEditEvent,
    handleDeleteEvent,
    handleTodoChange,
    handleTodoRemove,
    handleTodoAdd,
    handleSaveEvent,
    handleAddEventClick,
    handleExtractSuccess,
    handleToggleFavorite,
    setShowAuthModal,

    // Fetch functions
    fetchDashboardData: () => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
      queryClient.invalidateQueries({ queryKey: ['personalEvents'] });
      queryClient.invalidateQueries({ queryKey: ['schoolAuthorizations'] });
    }
  };
}
