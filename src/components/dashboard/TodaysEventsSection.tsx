import React from 'react';
import { Event as CustomEvent } from '../../utils/dateGrouping';
import { EventCard } from './EventCard';
import { Calendar, Clock } from "lucide-react";
import { formatDate } from '../../utils/dateUtils';

export interface TodaysEventsSectionProps {
  events: CustomEvent[];
  onEditEvent?: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  isSchoolAdmin?: boolean;
}

export const TodaysEventsSection: React.FC<TodaysEventsSectionProps> = ({
  events,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleFavorite,
  isSchoolAdmin
}) => {
  // If no events today, return null
  if (!events || events.length === 0) {
    return null;
  }

  const today = new Date();
  const formattedToday = formatDate(today.toISOString().split('T')[0], { 
    short: false, 
    includeYear: false 
  });

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
          Today — {formattedToday}
        </span>
        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
        <div className="flex-1 h-px bg-blue-200" />
      </div>
      <div className="space-y-1.5">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEditEvent={onEditEvent}
            onCloneEvent={onCloneEvent}
            onDeleteEvent={onDeleteEvent}
            onToggleFavorite={onToggleFavorite}
            isSchoolAdmin={isSchoolAdmin}
          />
        ))}
      </div>
    </div>
  );
}; 