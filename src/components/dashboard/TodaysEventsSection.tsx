import React from 'react';
import { Event as CustomEvent } from '../../utils/dateGrouping';
import { EventCard } from './EventCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mb-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-lg font-semibold text-blue-900">
              Today's Events - {formattedToday}
            </CardTitle>
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border-l-4 border-l-blue-400 bg-white rounded-lg inline-block">
                <EventCard
                  event={event}
                  onEditEvent={onEditEvent}
                  onCloneEvent={onCloneEvent}
                  onDeleteEvent={onDeleteEvent}
                  onToggleFavorite={onToggleFavorite}
                  isSchoolAdmin={isSchoolAdmin}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 