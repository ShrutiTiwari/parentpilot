import React from 'react';
import { groupEventsByMonthAndWeek } from '@/utils/dateGrouping';
import { DayEventsCard } from './DayEventsCard';
import { Calendar } from "lucide-react";
import { Event as CustomEvent } from '@/utils/dateGrouping';

export interface EventsWeekSectionProps {
  events: CustomEvent[];
  onEditEvent?: (event: CustomEvent) => void;
  onCloneEvent?: (event: CustomEvent) => void;
  onDeleteEvent?: (event: CustomEvent) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  isSchoolAdmin?: boolean;
}

export const EventsWeekSection: React.FC<EventsWeekSectionProps> = ({
  events,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleFavorite,
  isSchoolAdmin
}) => {
  // Group events by month and week
  const monthGroups = groupEventsByMonthAndWeek(events);
  
  // If no events, return null
  if (!monthGroups || monthGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {monthGroups.map((month, monthIndex) => (
        <div key={month.month} className="space-y-3">
          <h2 className="text-xl font-bold mb-3 text-[#1EAEDB]">{month.formattedMonth}</h2>
          {month.weeks.map((week, weekIndex) => (
            <div key={`${month.month}-${weekIndex}`} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Week of {week.formattedWeekRange}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {week.days.map((day) => (
                  <DayEventsCard
                    key={day.date}
                    date={day.date}
                    events={day.events}
                    onEditEvent={onEditEvent}
                    onCloneEvent={onCloneEvent}
                    onDeleteEvent={onDeleteEvent}
                    onToggleFavorite={onToggleFavorite}
                    isSchoolAdmin={isSchoolAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
