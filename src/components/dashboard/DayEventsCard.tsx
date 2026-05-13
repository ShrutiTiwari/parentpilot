import React from 'react';
import { Event } from '../../utils/dateGrouping';
import { EventCard } from './EventCard';
import { ThemedCard } from './ThemedCard';
import { useAgeTheme } from '../../contexts/AgeThemeContext';
import { getRelativeDayName, formatDate } from '../../utils/dateUtils';

interface DayEventsCardProps {
  date: string | null;
  events: Event[];
  onEditEvent: (event: Event) => void;
  onCloneEvent?: (event: Event) => void;
  onDeleteEvent?: (event: Event) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  isSchoolAdmin?: boolean;
}

export function DayEventsCard({ date, events, onEditEvent, onCloneEvent, onDeleteEvent, onToggleFavorite, isSchoolAdmin }: DayEventsCardProps) {
  const { currentTheme } = useAgeTheme();
  
  if (!date) return null;
  
  const dayName = getRelativeDayName(date);
  const dateFormatted = formatDate(date, { short: true, includeYear: false });

  if (events.length === 0) return null;

  return (
    <ThemedCard className="p-3 sm:p-4">
      <h3 
        className="text-lg font-semibold mb-2 sm:mb-3"
        style={{ color: currentTheme.colors.text }}
      >
        {dayName}, {dateFormatted}
      </h3>
      <div className="space-y-1.5 sm:space-y-2">
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
    </ThemedCard>
  );
}
