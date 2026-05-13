import React, { useState, useMemo } from 'react';
import { EventFilters } from '../EventFilters';
import { EventsWeekSection } from '../EventsWeekSection';
import { TodaysEventsSection } from '../TodaysEventsSection';
import { Event as CustomEvent } from '../../../utils/dateGrouping';
import { getVisibilityEmoji } from '../../../utils/eventVisibilityUtils';
import { GraduationCap, User } from 'lucide-react';
import { eventMatchesYearGroupFilter, getYearGroupsFromDatabase } from '@/utils/yearGroupUtils';

interface UnifiedViewTabProps {
  schoolEvents: CustomEvent[];
  personalEvents: CustomEvent[];
  onEditEvent: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
  isSchoolAdmin?: boolean;
}

export function UnifiedViewTab({
  schoolEvents,
  personalEvents,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  isSchoolAdmin
}: UnifiedViewTabProps) {
  // Combined events state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearGroup, setSelectedYearGroup] = useState('All');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(['school', 'personal']);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...schoolEvents, ...personalEvents];
  }, [schoolEvents, personalEvents]);

  // Get today's events
  const todaysEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allEvents.filter(event => event.date === today);
  }, [allEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYearGroup = eventMatchesYearGroupFilter(event, selectedYearGroup);
      const matchesCategories = selectedCategories.length === 0 || 
        selectedCategories.some(category => {
          if (category === 'HasToDos') {
            return event.todos && event.todos.length > 0;
          }
          return event.category === category;
        });
      const matchesEventType = selectedEventTypes.includes(event.event_type || 'personal');
      const matchesUpcoming = !showUpcomingOnly || new Date(event.date) >= new Date();
      
      return matchesSearch && matchesYearGroup && matchesCategories && matchesEventType && matchesUpcoming;
    });
  }, [allEvents, searchTerm, selectedYearGroup, selectedCategories, selectedEventTypes, showUpcomingOnly]);

  // Get unique year groups from both event types
  const yearGroups = useMemo(() => {
    const groups = new Set<string>();
    allEvents.forEach(event => {
      const eventYearGroups = getYearGroupsFromDatabase(
        typeof event.yearGroup === 'string' ? event.yearGroup : undefined,
        event.yearGroups
      );
      eventYearGroups.forEach(group => groups.add(group));
    });
    return ['All', ...Array.from(groups).sort()];
  }, [allEvents]);

  // Get unique categories from both event types
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allEvents.forEach(event => {
      if (event.category) {
        categories.add(event.category);
      }
    });
    return ['HasToDos', ...Array.from(categories).sort()];
  }, [allEvents]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedYearGroup('All');
    setShowUpcomingOnly(true);
    setSelectedCategories([]);
    setSelectedEventTypes(['school', 'personal']);
  };

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-purple-900 mb-3">
            No events yet! 📅
          </h3>
          <p className="text-purple-700 mb-6">
            You don't have any school or personal events yet. Start by adding some events to see them in your unified calendar!
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex justify-center mb-1">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-purple-800 font-medium">School Events</span>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex justify-center mb-1">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-purple-800 font-medium">Personal Events</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Custom Event Type Filter */}
      <div className="bg-white/95 rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Event Types</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { value: 'school', label: 'School Events', icon: <GraduationCap className="h-4 w-4" /> },
            { value: 'personal', label: 'Personal Events', icon: <User className="h-4 w-4" /> }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => {
                if (selectedEventTypes.includes(type.value)) {
                  setSelectedEventTypes(selectedEventTypes.filter(t => t !== type.value));
                } else {
                  setSelectedEventTypes([...selectedEventTypes, type.value]);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedEventTypes.includes(type.value)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          See all events together in one place and identify any conflicts
        </p>
      </div>

      <EventFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedYearGroup={selectedYearGroup}
        setSelectedYearGroup={setSelectedYearGroup}
        showUpcomingOnly={showUpcomingOnly}
        setShowUpcomingOnly={setShowUpcomingOnly}
        yearGroups={yearGroups}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        onResetFilters={resetFilters}
        showYearGroups={true}
        filteredEventsCount={filteredEvents.length}
        totalEventsCount={allEvents.length}
        events={allEvents}
      />

      <TodaysEventsSection 
        events={todaysEvents}
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
        isSchoolAdmin={isSchoolAdmin}
      />

      <EventsWeekSection 
        events={filteredEvents} 
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
        isSchoolAdmin={isSchoolAdmin}
      />
    </div>
  );
} 