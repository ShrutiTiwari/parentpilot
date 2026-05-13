import React from 'react';
import { groupEventsByMonthAndWeek } from '@/utils/dateGrouping';
import { EventsWeekSection } from './EventsWeekSection';
import { Event as CustomEvent } from '@/utils/dateGrouping';

export interface EventsMonthSectionProps {
  events: CustomEvent[];
  onEditEvent?: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  isSchoolAdmin?: boolean;
}

export const EventsMonthSection: React.FC<EventsMonthSectionProps> = ({
  events,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleFavorite,
  isSchoolAdmin
}) => {
  // If no events, return null
  if (!events || events.length === 0) {
    return null;
  }

  // The EventsWeekSection already handles the grouping, so just pass the events
  return (
    <EventsWeekSection
      events={events}
      onEditEvent={onEditEvent}
      onCloneEvent={onCloneEvent}
      onDeleteEvent={onDeleteEvent}
      onToggleFavorite={onToggleFavorite}
      isSchoolAdmin={isSchoolAdmin}
    />
  );
};
