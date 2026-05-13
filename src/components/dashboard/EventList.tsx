import React from 'react';
import { Event } from '../../utils/dateGrouping';
import { EventCard } from './EventCard';
import { formatDate, formatTime, compareDates } from '../../utils/dateUtils';
import { sortEventsByVisibility } from '../../utils/eventVisibilityUtils';

interface EventListProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  isSchoolAdmin?: boolean;
}

export function EventList({ events, onEditEvent, isSchoolAdmin }: EventListProps) {
  // Sort events by date first, then by visibility priority
  const sortedEvents = [...events].sort((a, b) => {
    const dateComparison = compareDates(a.date, b.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // If dates are the same, sort by visibility priority
    const visibilityA = a.visibility || 'private';
    const visibilityB = b.visibility || 'private';
    const priorityMap: Record<string, number> = {
      private: 0,
      verified_shared: 1,
      public: 2
    };
    return priorityMap[visibilityA] - priorityMap[visibilityB];
  });

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No events found for this date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEditEvent={onEditEvent}
          isSchoolAdmin={isSchoolAdmin}
        />
      ))}
    </div>
  );
} 