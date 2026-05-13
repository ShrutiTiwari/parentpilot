import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Event } from '../../utils/dateGrouping';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { cn } from '@/lib/utils';
import { getFestivalTheme } from '../../utils/festivalThemes';

interface FestivalEventCardProps {
  event: Event;
  className?: string;
}


export function FestivalEventCard({ event, className }: FestivalEventCardProps) {
  const festivalTheme = getFestivalTheme(event);
  const { theme, isFestival } = festivalTheme;

  // Format time display
  const startTime = event.time_start && event.time_start !== '00:00:00' ? formatTime(event.time_start) : null;
  const endTime = event.time_end && event.time_end !== '00:00:00' && event.time_end !== '23:59:59' ? formatTime(event.time_end) : null;
  const displayTime = startTime && endTime ? `${startTime} - ${endTime}` : startTime;
  const isAllDay = !displayTime || displayTime === '00:00 - 00:00';

  return (
    <Card
      className={cn(
        // Base styling
        'transition-all duration-300 hover:scale-105 cursor-pointer',
        // Theme colors
        theme.colors.cardBg || theme.colors.background,
        theme.colors.text,
        theme.colors.border,
        theme.colors.shadow,
        // Festival effects
        isFestival && theme.effects.glow,
        // Custom className
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {/* Festival emoji */}
          <span className="text-2xl">{festivalTheme.emoji}</span>

          {/* Event title */}
          <span className="flex-1">{event.title}</span>

          {/* Sparkles for festival events */}
          {isFestival && festivalTheme.effects.sparkles && (
            <span className="text-lg animate-pulse opacity-80">
              {festivalTheme.effects.sparkles}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date */}
        <div className={cn("flex items-center gap-2", theme.colors.accent)}>
          <Calendar className="h-4 w-4" />
          <span className="font-medium">
            {formatDate(event.date)}
          </span>
        </div>

        {/* Time (if not all-day) */}
        {!isAllDay && displayTime && (
          <div className={cn("flex items-center gap-2", theme.colors.accent)}>
            <Clock className="h-4 w-4" />
            <span>{displayTime}</span>
          </div>
        )}

        {/* Venue */}
        {event.venue && (
          <div className={cn("flex items-center gap-2", theme.colors.accent)}>
            <MapPin className="h-4 w-4" />
            <span>{event.venue}</span>
          </div>
        )}

        {/* Category badge */}
        {event.category && (
          <div className="flex justify-end">
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                isFestival
                  ? "bg-white/20 backdrop-blur-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              {event.category}
            </span>
          </div>
        )}

        {/* Festival special message */}
        {isFestival && (
          <div className={cn(
            "text-center text-sm font-medium py-2 px-3 rounded-lg",
            "bg-white/10 backdrop-blur-sm border border-white/20"
          )}>
            🎉 Special Event 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
}