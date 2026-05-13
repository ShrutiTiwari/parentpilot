import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OneOffEventsTab } from './OneOffEventsTab';
import { PersonalEventsTab } from './PersonalEventsTab';
import { UnifiedViewTab } from './UnifiedViewTab';
import { SchoolCodeSection } from '../SchoolCodeSection';
import { PersonalEventsEmptyState } from '../PersonalEventsEmptyState';
import { WelcomeBanner } from '../WelcomeBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/contexts/ChildProfileContext';

interface EventsTabProps {
  initialActiveSubTab?: string;
  hasSchoolAccess: boolean;
  showSchoolCodeEntry: boolean;
  setShowSchoolCodeEntry: (show: boolean) => void;
  // Props for school events
  schoolEvents: any[];
  schoolFilteredEvents: any[];
  schoolTodaysEvents: any[];
  schoolSearchTerm: string;
  setSchoolSearchTerm: (term: string) => void;
  schoolShowUpcomingOnly: boolean;
  setSchoolShowUpcomingOnly: (show: boolean) => void;
  schoolShowFavoritesOnly?: boolean;
  setSchoolShowFavoritesOnly?: (show: boolean) => void;
  schoolSelectedYearGroup: string;
  setSchoolSelectedYearGroup: (group: string) => void;
  schoolSelectedCategories: string[];
  setSchoolSelectedCategories: (categories: string[]) => void;
  yearGroups: string[];
  onEditEvent: (event: any) => void;
  onCloneEvent: (event: any) => void;
  onDeleteEvent: (event: any) => void;
  onToggleFavorite?: (eventId: string, isFavorite: boolean) => void;
  resetSchoolFilters: () => void;
  isSchoolAdmin?: boolean;

  // Props for personal events
  personalEvents: any[];
  personalFilteredEvents: any[];
  personalTodaysEvents: any[];
  personalSearchTerm: string;
  setPersonalSearchTerm: (term: string) => void;
  personalShowUpcomingOnly: boolean;
  setPersonalShowUpcomingOnly: (show: boolean) => void;
  personalSelectedCategories: string[];
  setPersonalSelectedCategories: (categories: string[]) => void;
  resetPersonalFilters: () => void;
}

export function EventsTab({
  initialActiveSubTab,
  hasSchoolAccess,
  showSchoolCodeEntry,
  setShowSchoolCodeEntry,
  schoolEvents,
  schoolFilteredEvents,
  schoolTodaysEvents,
  schoolSearchTerm,
  setSchoolSearchTerm,
  schoolShowUpcomingOnly,
  setSchoolShowUpcomingOnly,
  schoolShowFavoritesOnly,
  setSchoolShowFavoritesOnly,
  schoolSelectedYearGroup,
  setSchoolSelectedYearGroup,
  schoolSelectedCategories,
  setSchoolSelectedCategories,
  yearGroups,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleFavorite,
  resetSchoolFilters,
  isSchoolAdmin,
  personalEvents,
  personalFilteredEvents,
  personalTodaysEvents,
  personalSearchTerm,
  setPersonalSearchTerm,
  personalShowUpcomingOnly,
  setPersonalShowUpcomingOnly,
  personalSelectedCategories,
  setPersonalSelectedCategories,
  resetPersonalFilters
}: EventsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProfile } = useChildProfiles();
  const [activeSubTab, setActiveSubTab] = useState(initialActiveSubTab || 'school');

  // Handle sub-tab change with URL navigation
  const handleSubTabChange = (value: string) => {
    setActiveSubTab(value);
    
    // Navigate to appropriate events sub-URL
    switch (value) {
      case 'school':
        navigate('/events/school');
        break;
      case 'personal':
        navigate('/events/personal');
        break;
      case 'unified':
        navigate('/events/unified');
        break;
      default:
        navigate('/events');
    }
  };

  return (
    <div className="space-y-6">
      {/* Events Sub-Tabs */}
      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="school" className="text-xs sm:text-sm font-medium flex-1 min-w-0">
            <span className="hidden sm:inline">🏫 School Events</span>
            <span className="sm:hidden">🏫</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="text-xs sm:text-sm font-medium flex-1 min-w-0">
            <span className="hidden sm:inline">👤 Personal Events</span>
            <span className="sm:hidden">👤</span>
          </TabsTrigger>
          <TabsTrigger value="unified" className="text-xs sm:text-sm font-medium flex-1 min-w-0">
            <span className="hidden sm:inline">📅 Unified View</span>
            <span className="sm:hidden">📅</span>
          </TabsTrigger>
        </TabsList>

        {/* Welcome Banner */}
        <WelcomeBanner />

        <TabsContent value="school" className="space-y-6 mt-6">
          <div className="flex justify-end items-center mb-6">
            <SchoolCodeSection
              hasSchoolAccess={hasSchoolAccess}
              selectedProfileSchoolName={selectedProfile?.schoolName}
              onShowSchoolCodeEntry={() => setShowSchoolCodeEntry(true)}
              user={user}
            />
          </div>
          
          <OneOffEventsTab
            events={schoolEvents}
            filteredEvents={schoolFilteredEvents}
            todaysEvents={schoolTodaysEvents}
            searchTerm={schoolSearchTerm}
            setSearchTerm={setSchoolSearchTerm}
            showUpcomingOnly={schoolShowUpcomingOnly}
            setShowUpcomingOnly={setSchoolShowUpcomingOnly}
            showFavoritesOnly={schoolShowFavoritesOnly}
            setShowFavoritesOnly={setSchoolShowFavoritesOnly}
            selectedYearGroup={schoolSelectedYearGroup}
            setSelectedYearGroup={setSchoolSelectedYearGroup}
            selectedCategories={schoolSelectedCategories}
            setSelectedCategories={setSchoolSelectedCategories}
            yearGroups={yearGroups}
            onEditEvent={onEditEvent}
            onCloneEvent={onCloneEvent}
            onDeleteEvent={onDeleteEvent}
            onToggleFavorite={onToggleFavorite}
            onResetFilters={resetSchoolFilters}
            isSchoolAdmin={isSchoolAdmin}
          />
        </TabsContent>

        <TabsContent value="personal" className="space-y-6 mt-6">
          {personalEvents.length === 0 && <PersonalEventsEmptyState />}

          <PersonalEventsTab
            events={personalEvents}
            filteredEvents={personalFilteredEvents}
            todaysEvents={personalTodaysEvents}
            searchTerm={personalSearchTerm}
            setSearchTerm={setPersonalSearchTerm}
            showUpcomingOnly={personalShowUpcomingOnly}
            setShowUpcomingOnly={setPersonalShowUpcomingOnly}
            selectedCategories={personalSelectedCategories}
            setSelectedCategories={setPersonalSelectedCategories}
            onEditEvent={onEditEvent}
            onCloneEvent={onCloneEvent}
            onDeleteEvent={onDeleteEvent}
            onResetFilters={resetPersonalFilters}
          />
        </TabsContent>

        <TabsContent value="unified" className="space-y-6 mt-6">
          <UnifiedViewTab 
            schoolEvents={schoolEvents}
            personalEvents={personalEvents}
            onEditEvent={onEditEvent}
            onCloneEvent={onCloneEvent}
            onDeleteEvent={onDeleteEvent}
            isSchoolAdmin={isSchoolAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 