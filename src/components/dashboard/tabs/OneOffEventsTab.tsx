import React from 'react';
import { EventFilters } from '../EventFilters';
import { EventsWeekSection } from '../EventsWeekSection';
import { EventsMonthSection } from '../EventsMonthSection';
import { TodaysEventsSection } from '../TodaysEventsSection';
import { Event as CustomEvent } from '../../../utils/dateGrouping';
import { getVisibilityEmoji } from '../../../utils/eventVisibilityUtils';

interface OneOffEventsTabProps {
  events: CustomEvent[];
  filteredEvents: CustomEvent[];
  todaysEvents: CustomEvent[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedYearGroup: string;
  setSelectedYearGroup: (group: string) => void;
  showUpcomingOnly: boolean;
  setShowUpcomingOnly: (show: boolean) => void;
  showFavoritesOnly?: boolean;
  setShowFavoritesOnly?: (show: boolean) => void;
  yearGroups: string[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  onResetFilters: () => void;
  onEditEvent: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  isSchoolAdmin?: boolean;
}

export function OneOffEventsTab({
  events,
  filteredEvents,
  todaysEvents,
  searchTerm,
  setSearchTerm,
  selectedYearGroup,
  setSelectedYearGroup,
  showUpcomingOnly,
  setShowUpcomingOnly,
  showFavoritesOnly,
  setShowFavoritesOnly,
  yearGroups,
  selectedCategories,
  setSelectedCategories,
  onResetFilters,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleFavorite,
  isSchoolAdmin
}: OneOffEventsTabProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">
            No school events yet! 📚
          </h3>
          <p className="text-blue-700 mb-6">
            This school doesn't have any events uploaded yet. Be the first to help other parents by adding events!
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/50 rounded-lg p-3">
              <span className="text-2xl block mb-1">📅</span>
              <span className="text-blue-800 font-medium">Term Dates</span>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <span className="text-2xl block mb-1">🎭</span>
              <span className="text-blue-800 font-medium">School Plays</span>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <span className="text-2xl block mb-1">🏃‍♀️</span>
              <span className="text-blue-800 font-medium">Sports Days</span>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <span className="text-2xl block mb-1">{getVisibilityEmoji('verified_shared')}</span>
              <span className="text-blue-800 font-medium">Parent Events</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EventFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedYearGroup={selectedYearGroup}
        setSelectedYearGroup={setSelectedYearGroup}
        showUpcomingOnly={showUpcomingOnly}
        setShowUpcomingOnly={setShowUpcomingOnly}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        yearGroups={yearGroups}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        onResetFilters={onResetFilters}
        showYearGroups={true}
        filteredEventsCount={filteredEvents.length}
        totalEventsCount={events.length}
        events={events}
      />
      
      <TodaysEventsSection
        events={todaysEvents}
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
        onToggleFavorite={onToggleFavorite}
        isSchoolAdmin={isSchoolAdmin}
      />

      <EventsMonthSection
        events={filteredEvents}
        onEditEvent={onEditEvent}
        onCloneEvent={onCloneEvent}
        onDeleteEvent={onDeleteEvent}
        onToggleFavorite={onToggleFavorite}
        isSchoolAdmin={isSchoolAdmin}
      />
    </div>
  );
}
