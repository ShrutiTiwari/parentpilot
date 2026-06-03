import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, CheckSquare, Music4, Fish, Volleyball, Theater, Star } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Event } from '../../utils/dateGrouping';
import { mapToStandardYearGroup } from '../../utils/yearGroupMapping';
import {
  getAvailableCategoriesFromEvents,
  getCategoryIcon,
  getCategoryLabel,
  SPECIAL_CATEGORIES
} from '../../utils/categoryUtils';

export enum YearGroup {
  All = 'All',
  Reception = 'Reception',
  Year1 = 'Year 1',
  Year2 = 'Year 2',
  Year3 = 'Year 3',
  Year4 = 'Year 4',
  Year5 = 'Year 5',
  Year6 = 'Year 6',
  Parents = 'Parents',
  Kindergarten = 'Kindergarten',
  UpperSchool = 'Upper School',
  LowerSchool = 'Lower School',
  EYFS = 'EYFS',
  Under11 = 'Under 11',
  Staff = 'Staff',
  JuniorSchool = 'Junior School',
  TripParticipants = 'Trip Participants',
}

interface EventFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedYearGroup: string;
  setSelectedYearGroup: (group: string) => void;
  showUpcomingOnly: boolean;
  setShowUpcomingOnly: (show: boolean) => void;
  showFavoritesOnly?: boolean;
  setShowFavoritesOnly?: (show: boolean) => void;
  yearGroups: string[];
  filteredEventsCount?: number;
  totalEventsCount?: number;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  events?: Event[];
  onResetFilters: () => void;
  showYearGroups?: boolean;
}

export function EventFilters({
  searchTerm,
  setSearchTerm,
  selectedYearGroup,
  setSelectedYearGroup,
  showUpcomingOnly,
  setShowUpcomingOnly,
  showFavoritesOnly = false,
  setShowFavoritesOnly,
  yearGroups,
  filteredEventsCount = 0,
  totalEventsCount = 0,
  selectedCategories,
  setSelectedCategories,
  events = [],
  onResetFilters,
  showYearGroups = true
}: EventFiltersProps) {
  const availableCategories = React.useMemo(() => {
    return getAvailableCategoriesFromEvents(events);
  }, [events]);

  // Get the appropriate icon for each category
  const getCategoryIconComponent = (category: string) => {
    const IconComponent = getCategoryIcon(category);
    if (category === SPECIAL_CATEGORIES.HAS_TODOS) {
      return <CheckSquare className="h-3 w-3" />;
    }
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([category]);
    }
  };

  const availableYearGroups = yearGroups;

  if (totalEventsCount === 0) {
    return (
      <div className="bg-white/95 rounded-lg shadow-sm p-6 text-center">
        <p className="text-[#221F26]/70 text-lg">We don't have events data for this school yet.</p>
        <p className="text-[#1EAEDB] mt-2 text-lg">Would you like to upload some?</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Horizontal Scrollable Filter Bar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 shadow-sm">
        <div className="overflow-x-auto">
          <div className="space-y-3">
            {/* First row - Main filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Year Group Dropdown */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-700">Show:</span>
                <Select value={selectedYearGroup} onValueChange={setSelectedYearGroup}>
                  <SelectTrigger className="w-48 h-9 text-sm border-[#1EAEDB]/30 focus:ring-[#1EAEDB]/50">
                    <SelectValue placeholder="Select year group" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="All">All Events</SelectItem>
                    {Object.values(YearGroup).filter(group => group !== 'All').map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upcoming Only Button */}
              <Button
                onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
                size="sm"
                className={`flex items-center gap-2 h-9 px-4 text-sm whitespace-nowrap
                  ${showUpcomingOnly
                    ? 'bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90'
                    : 'bg-white text-[#1EAEDB] border border-[#1EAEDB]/40 hover:bg-[#F0F9FB]'}
                `}
              >
                <Filter className="h-4 w-4" />
                Upcoming Only
              </Button>

              {/* Favorites Only Button */}
              {setShowFavoritesOnly && (
                <Button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  size="sm"
                  className={`flex items-center gap-2 h-9 px-4 text-sm whitespace-nowrap
                    ${showFavoritesOnly
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-white text-yellow-600 border border-yellow-500/40 hover:bg-yellow-50'}
                  `}
                >
                  <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-white' : 'fill-yellow-500'}`} />
                  Favorites Only
                </Button>
              )}

              {/* Show All Events Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="h-9 px-4 text-sm whitespace-nowrap text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Show All Events
              </Button>
            </div>

            {/* Second row - Category filters */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {availableCategories.slice(0, 6).map(category => {
                    const selected = selectedCategories.includes(category);
                    const categoryIcon = getCategoryIconComponent(category);
                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                          ${selected
                            ? 'bg-[#1EAEDB] text-white border-[#1EAEDB] shadow-sm'
                            : 'bg-white text-[#1EAEDB] border-[#1EAEDB]/40 hover:bg-[#F0F9FB]'}
                        `}
                      >
                        {categoryIcon}
                        {getCategoryLabel(category)}
                      </button>
                    );
                  })}
                  {availableCategories.length > 6 && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      +{availableCategories.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Count Display */}
      <div className="flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200/50">
          <span className="text-sm font-medium text-[#221F26]/80">
            Showing {filteredEventsCount} of {totalEventsCount} events
          </span>
        </div>
      </div>

      {/* Clear Category Filter (when active) */}
      {selectedCategories.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setSelectedCategories([])}
            className="text-sm text-red-600 underline hover:text-red-800"
          >
            Clear Category Filter
          </button>
        </div>
      )}
    </div>
  );
}
