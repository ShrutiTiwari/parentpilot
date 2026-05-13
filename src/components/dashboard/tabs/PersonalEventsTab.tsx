import React from 'react';
import { EventFilters } from '../EventFilters';
import { EventsWeekSection } from '../EventsWeekSection';
import { TodaysEventsSection } from '../TodaysEventsSection';
import { Event as CustomEvent } from '../../../utils/dateGrouping';

interface PersonalEventsTabProps {
  events: CustomEvent[];
  filteredEvents: CustomEvent[];
  todaysEvents: CustomEvent[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showUpcomingOnly: boolean;
  setShowUpcomingOnly: (show: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  onResetFilters: () => void;
  onEditEvent: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
}

export function PersonalEventsTab({
  events,
  filteredEvents,
  todaysEvents,
  searchTerm,
  setSearchTerm,
  showUpcomingOnly,
  setShowUpcomingOnly,
  selectedCategories,
  setSelectedCategories,
  onResetFilters,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent
}: PersonalEventsTabProps) {
  if (events.length === 0) {
    return null; // Empty state is handled by PersonalEventsEmptyState in Dashboard
  }

  return (
    <div className="space-y-4">
      <EventFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedYearGroup="All"
        setSelectedYearGroup={() => {}}
        showUpcomingOnly={showUpcomingOnly}
        setShowUpcomingOnly={setShowUpcomingOnly}
        yearGroups={[]}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        onResetFilters={onResetFilters}
        showYearGroups={false}
        filteredEventsCount={filteredEvents.length}
        totalEventsCount={events.length}
        events={events}
      />
      
      <TodaysEventsSection 
        events={todaysEvents}
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
      />
      
      <EventsWeekSection 
        events={filteredEvents} 
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
      />
    </div>
  );
}
