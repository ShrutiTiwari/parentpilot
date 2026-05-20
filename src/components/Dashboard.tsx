import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { EventsTab } from './dashboard/tabs/EventsTab';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChildProfiles } from '../contexts/ChildProfileContext';
import { useSchoolAuthorizations } from '../contexts/SchoolAuthorizationContext';
import { SchoolCodeEntry } from './auth/SchoolCodeEntry';
import { useSchoolAdminStatus } from '@/hooks/useSchoolAdminStatus';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { AddEventTabs } from './dashboard/AddEventTabs';
import { EventDialog } from './dashboard/EventDialog';
import { SchoolCodeSection } from './dashboard/SchoolCodeSection';
import { useEventManagement } from '@/hooks/useEventManagement';
import { convertToInputFormat, isDateInFuture, isDateToday } from '../utils/dateUtils';
import { Event as CustomEvent } from '../utils/dateGrouping';
import { getClonedEventVisibility } from '../utils/eventVisibilityUtils';
import { eventMatchesYearGroupFilter } from '@/utils/yearGroupUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { ChildProfileSelector } from './profile/ChildProfileSelector';
import { ManageProfilesDialog } from './profile/ManageProfilesDialog';
import { PdfUploadSection } from './dashboard/PdfUploadSection';
import { isFeatureEnabled } from '../config/features';
import { DonationModal } from './donation/DonationModal';
import { displayEvent } from '@/utils/visbilityControl';
import { EmailInboxPanel } from './email/EmailInboxPanel';
import { AgentReviewCard, AgentExtractedEvent } from './email/AgentReviewCard';

interface DashboardProps {
  showAuthModal?: boolean;
  setShowAuthModal?: (show: boolean, action?: string) => void;
  onSignOut?: () => void;
  initialActiveTab?: string;
  initialActiveSubTab?: string;
}

export function Dashboard({ showAuthModal, setShowAuthModal, onSignOut, initialActiveTab, initialActiveSubTab }: DashboardProps) {
  const { selectedProfile } = useChildProfiles();
  const { authorizedSchools } = useSchoolAuthorizations();
  const { currentTheme } = useAgeTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const {
    events,
    personalEvents,
    yearGroups,
    loading,
    showEventDialog,
    editingEvent,
    showAiWarning,
    newEvent,
    savingEvent,
    hasSchoolAccess,
    setNewEvent,
    setShowEventDialog,
    handleEditEvent,
    handleTodoChange,
    handleTodoRemove,
    handleTodoAdd,
    handleSaveEvent,
    handleAddEventClick,
    handleExtractSuccess,
    fetchDashboardData,
    extractedEvents,
    setExtractedEvents,
    handleDeleteEvent,
    handleToggleFavorite
  } = useEventManagement(showAuthModal, setShowAuthModal);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearGroup, setSelectedYearGroup] = useState('All');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [showDonationCard, setShowDonationCard] = useState(false);
  const [showSchoolCodeEntry, setShowSchoolCodeEntry] = useState(false);
  const [personalSearchTerm, setPersonalSearchTerm] = useState('');
  const [personalShowUpcomingOnly, setPersonalShowUpcomingOnly] = useState(true);
  const [personalSelectedCategories, setPersonalSelectedCategories] = useState<string[]>([]);

  // Screenshot extraction review — shows AgentReviewCard instead of EventDialog
  const [screenshotReview, setScreenshotReview] = useState<{
    events: AgentExtractedEvent[];
    sourceLabel: string;
  } | null>(null);

  const handleScreenshotExtractSuccess = (extractedData: any) => {
    const eventsArray = Array.isArray(extractedData) ? extractedData
      : extractedData?.events ? extractedData.events
      : [extractedData];

    const mapped: AgentExtractedEvent[] = eventsArray.map((e: any) => ({
      title: e.title || '',
      date: e.date || '',
      time_start: e.time_start || null,
      time_end: e.time_end || null,
      venue: e.venue || null,
      year_group: e.year_group || e.yearGroup || 'All',
      category: e.category || 'general',
      description: e.description || '',
      actions: e.actions
        ? e.actions
        : (e.todos || []).map((t: any) => ({ text: t.text, deadline: t.deadline || null })),
      confidence_score: e.confidence_score || 0.8,
    }));

    setScreenshotReview({ events: mapped, sourceLabel: eventsArray[0]?.source || 'screenshot' });
  };

  const handleViewInCalendar = useCallback((event: any) => {
    setNewEvent({
      title: event.title || '',
      date: event.date || '',
      category: event.category || '',
      yearGroup: event.year_group || 'All',
      event_type: event.event_type || 'personal',
      visibility: event.visibility || 'private',
      time_start: event.time_start || '',
      time_end: event.time_end || '',
      venue: event.venue || '',
      todos: [],
      created_by_user_id: event.created_by_user_id || null,
      school_id: event.school_id || null,
    });
    setShowEventDialog(true);
  }, [setNewEvent, setShowEventDialog]);

  const selectedSchoolId = authorizedSchools.find(
    auth => auth.schools?.name === selectedProfile?.schoolName
  )?.school_id;
  const { isAdmin: isSchoolAdmin } = useSchoolAdminStatus(selectedSchoolId);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedYearGroup('All');
    setShowUpcomingOnly(true);
    setShowFavoritesOnly(false);
    setSelectedCategories([]);
  };

  const resetPersonalFilters = () => {
    setPersonalSearchTerm('');
    setPersonalShowUpcomingOnly(true);
    setPersonalSelectedCategories([]);
  };

  useEffect(() => {
    if (selectedProfile) {
      fetchDashboardData();
    }
  }, [selectedProfile]);

  const handleCloneEvent = (event: CustomEvent) => {
    const clonedEvent = {
      title: `Copy of ${event.title}`,
      date: event.date,
      category: event.category || 'general',
      yearGroup: Array.isArray(event.yearGroup) ? event.yearGroup[0] : (event.yearGroup || 'All'),
      event_type: event.event_type || 'school',
      visibility: getClonedEventVisibility(event, isSchoolAdmin),
      time_start: event.time_start || '',
      time_end: event.time_end || '',
      venue: event.venue || '',
      todos: event.todos ? [...event.todos] : [],
      created_by_user_id: user?.id || null,
      school_id: selectedProfile?.schoolId || event.school_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setNewEvent(clonedEvent);
    setShowEventDialog(true);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: currentTheme.colors.primary }}
        />
      </div>
    );
  }

  const flatYearGroups = Array.isArray(yearGroups) ? yearGroups.flat().filter(g => typeof g === 'string') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top nav */}
      <div className="w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-lg font-bold text-gray-800 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 h-auto"
            >
              🏠 Parent Pilot
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:bg-purple-100 hover:text-purple-700"
                  onClick={onSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                {displayEvent(user) && (
                  <ChildProfileSelector onManageProfiles={() => setIsProfileDialogOpen(true)} />
                )}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                onClick={() => setShowAuthModal?.(true, 'general')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <div
        className="w-full mx-auto px-0 sm:px-2 py-0 sm:py-4 min-h-screen"
        style={{ background: currentTheme.colors.background }}
      >
        <SchoolCodeEntry
          open={showSchoolCodeEntry}
          onOpenChange={setShowSchoolCodeEntry}
          onSuccess={fetchDashboardData}
        />

        <EventDialog
          open={showEventDialog}
          onOpenChange={setShowEventDialog}
          editingEvent={editingEvent}
          showAiWarning={showAiWarning}
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          yearGroups={[]}
          selectedProfile={selectedProfile}
          savingEvent={savingEvent}
          isAdmin={isSchoolAdmin}
          onSave={handleSaveEvent}
          onTodoChange={handleTodoChange}
          onTodoRemove={handleTodoRemove}
          onTodoAdd={handleTodoAdd}
          initialEventType={!user ? 'personal' : (selectedProfile ? 'school' : 'personal')}
          extractedEvents={extractedEvents}
          setExtractedEvents={setExtractedEvents}
        />

        <div className="max-w-6xl mx-auto bg-white/60 backdrop-blur-sm px-0 sm:px-4 pb-4 shadow-lg border border-white/20">
          <div className="py-3 sm:py-4">
            <div className="max-w-6xl mx-auto">
              {isFeatureEnabled('PDF_UPLOAD_ENABLED') ? (
                <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-center">
                  <div className="flex-1 max-w-md mx-auto lg:mx-0">
                    <AddEventTabs
                      eventType={!user ? 'personal' : (selectedProfile ? 'school' : 'personal')}
                      onExtractSuccess={handleScreenshotExtractSuccess}
                      onAddEventClick={() => handleAddEventClick(!user ? 'personal' : (selectedProfile ? 'school' : 'personal'))}
                      className="h-full"
                      selectedProfile={selectedProfile}
                      userId={user?.id}
                    />
                  </div>
                  <div className="flex-1 max-w-md mx-auto lg:mx-0">
                    <PdfUploadSection
                      onExtractSuccess={handleScreenshotExtractSuccess}
                      showPdfUpload={isFeatureEnabled('PDF_UPLOAD_ENABLED')}
                      className="h-full"
                      selectedProfile={selectedProfile}
                      userId={user?.id}
                      eventType={!user ? 'personal' : (selectedProfile ? 'school' : 'personal')}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="max-w-md w-full">
                    <AddEventTabs
                      eventType={!user ? 'personal' : (selectedProfile ? 'school' : 'personal')}
                      onExtractSuccess={handleScreenshotExtractSuccess}
                      onAddEventClick={() => handleAddEventClick(!user ? 'personal' : (selectedProfile ? 'school' : 'personal'))}
                      className="h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {user && screenshotReview && (
            <div className="px-4 pt-2 mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Screenshot · {screenshotReview.events.length} event{screenshotReview.events.length > 1 ? 's' : ''} extracted
              </p>
              <AgentReviewCard
                source="screenshot"
                sourceLabel={screenshotReview.sourceLabel}
                events={screenshotReview.events}
                confidenceScore={screenshotReview.events[0]?.confidence_score ?? 0.8}
                showEventTypePicker={true}
                onConfirm={async (eventsToSave) => {
                  for (const ev of eventsToSave) {
                    const isSchool = ev.event_type === 'school';
                    await handleSaveEvent({
                      title: ev.title,
                      date: ev.date,
                      category: ev.category,
                      yearGroup: ev.year_group,
                      event_type: ev.event_type || (selectedProfile ? 'school' : 'personal'),
                      visibility: 'private',
                      time_start: ev.time_start || '',
                      time_end: ev.time_end || '',
                      venue: ev.venue || '',
                      description: ev.description || '',
                      todos: ev.actions.map(a => ({ text: a.text, completed: false, deadline: a.deadline || null })),
                      created_by_user_id: user?.id || null,
                      school_id: isSchool ? (selectedProfile?.schoolId || null) : null,
                    });
                  }
                }}
                onDiscard={async () => setScreenshotReview(null)}
              />
            </div>
          )}

          {user && (
            <div className="px-4 pt-2">
              <EmailInboxPanel
                onViewInCalendar={handleViewInCalendar}
              />
            </div>
          )}

          <div className="space-y-6">
            <EventsTab
              initialActiveSubTab={initialActiveSubTab}
              hasSchoolAccess={hasSchoolAccess}
              showSchoolCodeEntry={showSchoolCodeEntry}
              setShowSchoolCodeEntry={setShowSchoolCodeEntry}
              schoolEvents={events}
              schoolFilteredEvents={events.filter(event => {
                const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesYearGroup = eventMatchesYearGroupFilter(event, selectedYearGroup);
                const matchesCategories = selectedCategories.length === 0 ||
                  selectedCategories.some(category => {
                    if (category === 'HasToDos') return event.todos && event.todos.length > 0;
                    return event.category === category;
                  });
                const matchesUpcoming = !showUpcomingOnly || isDateInFuture(event.date);
                const matchesFavorites = !showFavoritesOnly || event.isFavorite === true;
                return matchesSearch && matchesYearGroup && matchesCategories && matchesUpcoming && matchesFavorites;
              })}
              schoolTodaysEvents={events.filter(event => isDateToday(event.date))}
              schoolSearchTerm={searchTerm}
              setSchoolSearchTerm={setSearchTerm}
              schoolShowUpcomingOnly={showUpcomingOnly}
              setSchoolShowUpcomingOnly={setShowUpcomingOnly}
              schoolShowFavoritesOnly={showFavoritesOnly}
              setSchoolShowFavoritesOnly={setShowFavoritesOnly}
              schoolSelectedYearGroup={selectedYearGroup}
              setSchoolSelectedYearGroup={setSelectedYearGroup}
              schoolSelectedCategories={selectedCategories}
              setSchoolSelectedCategories={setSelectedCategories}
              yearGroups={flatYearGroups}
              onEditEvent={handleEditEvent}
              onCloneEvent={handleCloneEvent}
              onDeleteEvent={handleDeleteEvent}
              onToggleFavorite={handleToggleFavorite}
              resetSchoolFilters={resetFilters}
              isSchoolAdmin={isSchoolAdmin}
              personalEvents={personalEvents}
              personalFilteredEvents={personalEvents.filter(event => {
                const matchesSearch = event.title.toLowerCase().includes(personalSearchTerm.toLowerCase());
                const matchesCategories = personalSelectedCategories.length === 0 ||
                  personalSelectedCategories.some(category => {
                    if (category === 'HasToDos') return event.todos && event.todos.length > 0;
                    return event.category === category;
                  });
                const matchesUpcoming = !personalShowUpcomingOnly || isDateInFuture(event.date);
                return matchesSearch && matchesCategories && matchesUpcoming;
              })}
              personalTodaysEvents={personalEvents.filter(event => isDateToday(event.date))}
              personalSearchTerm={personalSearchTerm}
              setPersonalSearchTerm={setPersonalSearchTerm}
              personalShowUpcomingOnly={personalShowUpcomingOnly}
              setPersonalShowUpcomingOnly={setPersonalShowUpcomingOnly}
              personalSelectedCategories={personalSelectedCategories}
              setPersonalSelectedCategories={setPersonalSelectedCategories}
              resetPersonalFilters={resetPersonalFilters}
            />
          </div>
        </div>

        <DonationModal
          open={showDonationCard}
          onOpenChange={setShowDonationCard}
          trigger="manual"
        />

        <ManageProfilesDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
        />
      </div>
    </div>
  );
}
