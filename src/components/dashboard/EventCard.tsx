import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Music4, Fish, Volleyball, FileText, Theater, MapPin, Lock, Globe, Users, Copy, Trash2, GraduationCap, User, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Event, TodoItem } from '../../utils/dateGrouping';
import { formatDate, formatTime, formatDay, isValidDate } from '../../utils/dateUtils';
import { getEventStyle } from '../../utils/categoryStyles';
import { TodoChecklist } from './TodoChecklist';
import { getEventVisibility, getVisibilityEmoji, getVisibilityDescription, canEditEvent } from '../../utils/eventVisibilityUtils';
import { getCategoryIcon } from '../../utils/categoryUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getYearGroupsFromDatabase } from '@/utils/yearGroupUtils';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getFestivalTheme } from '@/utils/festivalThemes';

// Custom horizontal dots icon component
const MoreHorizontal = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-gray-500"
  >
    <circle cx="4" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
  </svg>
);

interface EventCardProps {
  event: Event;
  onEditEvent?: (event: Event) => void;
  onCloneEvent?: (event: Event) => void;
  onDeleteEvent?: (event: Event) => void;
  isSchoolAdmin?: boolean;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
}

export function EventCard({ event, onEditEvent, onCloneEvent, onDeleteEvent, isSchoolAdmin, onToggleFavorite }: EventCardProps) {
  const isMobile = useIsMobile();
  const [showVisibilityInfo, setShowVisibilityInfo] = useState(false);

  // Initialize state with the todos from the event
  const [eventTodos, setEventTodos] = useState<TodoItem[]>(
    event.todos || []
  );

  // Update eventTodos when event.todos changes
  useEffect(() => {
    setEventTodos(event.todos || []);
  }, [event.todos]);

  // Close visibility info when event changes
  useEffect(() => {
    setShowVisibilityInfo(false);
  }, [event.id]);

  // Handle click outside to close visibility info
  useEffect(() => {
    if (!isMobile || !showVisibilityInfo) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.visibility-info-container')) {
        setShowVisibilityInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, showVisibilityInfo]);

  // Safety check for malformed event data
  if (!event || !event.title) {
    return null;
  }

  const categoryStyle = getEventStyle(event.category || 'general');

  // Get festival theme
  const festivalTheme = getFestivalTheme(event);

  // Format date for display
  const formattedDate = formatDay(event.date);
  const isValidEventDate = isValidDate(event.date);

  // Format time for display
  const formattedTime = event.time_start ? formatTime(event.time_start) : '';

  // Compute display time (hh:mm only)
  const displayTime = event.time
    || (event.time_start && event.time_end
      ? `${formattedTime} - ${formatTime(event.time_end)}`
      : formattedTime || formatTime(event.time_end) || '');
  const isAllDayEvent = (!displayTime || displayTime.toLowerCase() === 'all day' || displayTime === '00:00 - 00:00' || displayTime === '00:00' || displayTime === '12:00 AM - 12:00 AM' || displayTime === '12:00 AM');

  // Check if event is private - only personal events are considered private
  const isPrivateEvent = event.event_type === 'personal';

  // Check if event is a public school event
  const isPublicSchoolEvent = event.event_type === 'school' && getEventVisibility(event) === 'public';

  // Check if event is a private school event (needs school code)
  const isPrivateSchoolEvent = event.event_type === 'school' && getEventVisibility(event) === 'private';

  // Get event type styling for unified view
  const getEventTypeBorder = () => {
    if (event.event_type === 'personal') {
      return 'border-l-4 border-l-purple-400'; // Purple for personal events
    } else if (event.event_type === 'school') {
      return 'border-l-4 border-l-blue-400'; // Blue for school events
    }
    return ''; // Default no border
  };

  // Get event type header styling
  const getEventTypeHeader = () => {
    if (event.event_type === 'personal') {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'Personal Event',
        icon: <User className="h-4 w-4" />
      };
    } else if (event.event_type === 'school') {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'School Event',
        icon: <GraduationCap className="h-4 w-4" />
      };
    }
    return {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      label: 'Event',
      icon: <Calendar className="h-4 w-4" />
    };
  };

  // Get special styling for private events
  const getPrivateEventStyling = () => {
    const isPrivate = event.event_type === 'personal' || getEventVisibility(event) === 'private';
    if (isPrivate) {
      return {
        shadow: 'shadow-2xl shadow-yellow-400/70',
        border: 'border-2 border-yellow-300',
        transform: 'scale-[1.02]',
        zIndex: 'z-10'
      };
    }
    return {
      shadow: 'shadow-sm',
      border: '',
      transform: '',
      zIndex: ''
    };
  };

  // Get the appropriate icon based on category
  const CategoryIcon = () => {
    const IconComponent = getCategoryIcon(event.category);
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  // Handle todo toggle
  const handleTodoToggle = (todoId: string) => {
    setEventTodos(prevTodos => {
      const newTodos = prevTodos.map(todo => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      return newTodos;
    });
  };

  const shouldShowTodos = Boolean(eventTodos && eventTodos.length > 0);

  // Get initials from child profile name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <Card
        className={`
          backdrop-blur-sm mb-2 transition-all duration-200 hover:scale-105
          ${festivalTheme.isFestival
            ? `${festivalTheme.colors.cardBg} ${festivalTheme.colors.text} ${festivalTheme.colors.shadow} ${festivalTheme.effects.glow}`
            : `border-[${categoryStyle.borderColor}] ${categoryStyle.gradient} hover:shadow-md`
          }
          ${getPrivateEventStyling().shadow} ${getPrivateEventStyling().border}
          ${getPrivateEventStyling().transform} ${getPrivateEventStyling().zIndex}
        `}
      >
        {/* Event Type Header */}
        <div className={`px-3 py-2 text-sm font-medium border-b flex justify-between items-center ${
          festivalTheme.isFestival
            ? `bg-black/10 border-white/20 ${festivalTheme.colors.text}`
            : `${getEventTypeHeader().bg} ${getEventTypeHeader().text} ${getEventTypeHeader().border}`
        }`}>
          <div className="flex items-center gap-2">
            {/* Festival emoji if available */}
            {festivalTheme.isFestival && festivalTheme.emoji && (
              <span className="text-lg">{festivalTheme.emoji}</span>
            )}
            {!festivalTheme.isFestival && getEventTypeHeader().icon}
            <span>{festivalTheme.isFestival ? `${festivalTheme.name} Event` : getEventTypeHeader().label}</span>
            {/* Festival sparkles */}
            {festivalTheme.isFestival && festivalTheme.effects.sparkles && (
              <span className="text-sm animate-pulse opacity-80">{festivalTheme.effects.sparkles}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 flex flex-col">
            <CardHeader className="pb-0 pt-1.5 px-2.5 sm:px-3 space-y-0">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CardTitle className={`text-base ${
                      festivalTheme.isFestival ? festivalTheme.colors.text : categoryStyle.textColor
                    }`}>
                      {event.title || 'Untitled Event'}
                    </CardTitle>
                    {event.childProfileName && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(event.childProfileName)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{event.childProfileName}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(event.id, !event.isFavorite);
                        }}
                        className="p-1 hover:bg-black/5 rounded-md flex-shrink-0"
                      >
                        <Star
                          className={`h-4 w-4 ${event.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Burger Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-black/5 rounded-md">
                        <MoreHorizontal />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onCloneEvent && (
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          onCloneEvent(event);
                        }}>
                          Clone Event
                        </DropdownMenuItem>
                      )}
                      {onEditEvent && (
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          onEditEvent(event);
                        }}>
                          Edit Event
                        </DropdownMenuItem>
                      )}
                      {onDeleteEvent && (
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          onDeleteEvent(event);
                        }}>
                          Delete Event
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Date and visibility icons on same line */}
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-1 ${
                    festivalTheme.isFestival ? festivalTheme.colors.accent : categoryStyle.textColor
                  }`}>
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">{formattedDate}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(() => {
                      const visibility = getEventVisibility(event);
                      const emoji = getVisibilityEmoji(visibility);
                      const description = getVisibilityDescription(visibility);
                      
                      if (isMobile) {
                        return (
                          <div className="relative visibility-info-container">
                            <button
                              onClick={() => setShowVisibilityInfo(!showVisibilityInfo)}
                              className="text-lg focus:outline-none"
                            >
                              {emoji}
                            </button>
                            {showVisibilityInfo && (
                              <div className="fixed sm:absolute bottom-auto sm:bottom-full top-1/2 sm:top-auto left-1/2 sm:left-auto right-auto sm:right-0 transform -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 mb-0 sm:mb-2 mx-4 sm:mx-0 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 max-w-[280px] sm:max-w-[250px]">
                                <div className="break-words text-center sm:text-left">
                                  {description}
                                </div>
                                <div className="hidden sm:block absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-lg">{emoji}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-1.5 pt-0.5 px-2.5 sm:px-3">
              <div className="space-y-1 text-xs">
                {event.venue && event.venue.trim() !== '' && (
                  <div className="flex items-center text-xs text-gray-500 mt-1 break-words whitespace-pre-line">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="block whitespace-pre-line break-words">{event.venue}</span>
                  </div>
                )}
                {!isAllDayEvent && (
                  <div className={`flex items-center gap-1 ${
                    festivalTheme.isFestival ? festivalTheme.colors.accent : 'text-[#221F26]/70'
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span>{displayTime}</span>
                  </div>
                )}
                
                {/* Year group and category icon on same line - swapped positions */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                    festivalTheme.isFestival
                      ? 'bg-white/20 backdrop-blur-sm text-white'
                      : `${categoryStyle.tagBg} ${categoryStyle.tagText}`
                  }`}>
                    {(() => {
                      const yearGroups = getYearGroupsFromDatabase(
                        typeof event.yearGroup === 'string' ? event.yearGroup : undefined,
                        event.yearGroups
                      );
                      return yearGroups.length > 0 ? yearGroups.join(', ') : 'All Years';
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {CategoryIcon() && (
                      <div className={`${categoryStyle.textColor}`}>
                        <CategoryIcon />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Todo Checklist Component */}
                {shouldShowTodos && (
                  <TodoChecklist 
                    todos={eventTodos}
                    onTodoToggle={handleTodoToggle}
                  />
                )}

                {/* Festival special badge */}
                {festivalTheme.isFestival && festivalTheme.effects.specialBadge && (
                  <div className="mt-3 text-center">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      bg-white/10 backdrop-blur-sm border border-white/20
                      ${festivalTheme.colors.text}
                    `}>
                      🎉 Special {festivalTheme.name} Event 🎉
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}