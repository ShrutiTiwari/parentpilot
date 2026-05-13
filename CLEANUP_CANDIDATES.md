# Cleanup Candidates — snap-remind-calendar-kid

These 186 files exist in **both** `parentpilot/src/` and `snap-remind-calendar-kid/src/`.

Once you've verified that `parentpilot` is stable and all PP features work correctly,
these files can be **deleted from `snap-remind-calendar-kid`** and replaced with imports
from a shared package or simply removed (since snap-remind will only need the ABRSM module).

> **Do not delete anything until:**
> - `powerparent.co.uk` is pointed at `parentpilot` deployment, OR
> - The ABRSM module has been extracted into its own standalone repo

---

## Shared files (186 total)

### Core
- `App.css`
- `App.tsx`
- `main.tsx`
- `index.css`
- `vite-env.d.ts`

### Pages
- `pages/Auth.tsx`
- `pages/auth/callback.tsx`
- `pages/Index.tsx`
- `pages/NotFound.tsx`
- `pages/ResetPassword.tsx`
- `pages/shared/[shareToken].tsx`

### Contexts
- `contexts/AgeThemeContext.tsx`
- `contexts/AuthContext.tsx`
- `contexts/ChildProfileContext.tsx`
- `contexts/SchoolAuthorizationContext.tsx`

### Hooks
- `hooks/use-mobile.tsx`
- `hooks/use-toast.ts`
- `hooks/useClarity.ts`
- `hooks/useDonation.ts`
- `hooks/useEventManagement.ts`
- `hooks/useFeedbackEligibility.ts`
- `hooks/useLocalStorage.ts`
- `hooks/useProfile.ts`
- `hooks/useSchoolAdminStatus.ts`
- `hooks/useSharing.ts`

### Config / Lib
- `config/api.ts`
- `config/features.ts`
- `constants/boards.ts`
- `lib/supabase.ts`
- `lib/utils.ts`

### Services
- `services/api.ts`
- `services/api/DataServiceContext.tsx`
- `services/api/implementations/DatabaseDataService.ts`
- `services/api/implementations/FileBasedDataService.ts`
- `services/api/index.ts`
- `services/api/interfaces/IDataService.ts`
- `services/childProfileService.ts`
- `services/dataService.ts`
- `services/feedbackService.ts`
- `services/imageTextExtractor.ts`
- `services/profileService.ts`
- `services/publicSharingService.ts`
- `services/schoolAuthorizationService.ts`
- `services/schoolDiscoveryService.ts`
- `services/sharingService.ts`
- `services/userFavoritesService.ts`
- `services/versionChecker.ts`
- `services/weekendPlanService.ts`
- `api/donation.ts`

### Types
- `types/childProfile.ts`
- `types/database.types.ts`
- `types/feedback.ts`
- `types/profile.ts`
- `integrations/supabase/types.ts`

### Utils
- `utils/activityTypes.ts`
- `utils/ageThemes.ts`
- `utils/analytics.ts`
- `utils/auth.ts`
- `utils/categoryStyles.ts`
- `utils/categoryUtils.ts`
- `utils/dateGrouping.ts`
- `utils/dateUtils.ts`
- `utils/eventUtils.ts`
- `utils/eventVisibilityUtils.ts`
- `utils/feedbackSecurity.ts`
- `utils/festivalThemes.ts`
- `utils/formatUtils.ts`
- `utils/logger.ts`
- `utils/navigationUtils.ts`
- `utils/onboardingTest.ts`
- `utils/titleUtils.ts`
- `utils/visbilityControl.ts`
- `utils/weekendPlanTypes.ts`
- `utils/yearGroupMapping.ts`
- `utils/yearGroupUtils.ts`

### Components — Dashboard & Events
- `components/Dashboard.tsx`
- `components/DashboardWrapper.tsx`
- `components/EventExtractor.tsx`
- `components/EventsLanding.tsx`
- `components/EventsLanding_abexp.tsx`
- `components/Calendar.tsx`
- `components/Header.tsx`
- `components/LandingPage.tsx`
- `components/OnboardingWrapper.tsx`
- `components/PowerParentIntegratedLanding.tsx`
- `components/QuotesCarousel.tsx`
- `components/StickyFooter.tsx`
- `components/VersionUpdateNotification.tsx`
- `components/WeeklySchedule.tsx`
- `components/events/EventsContent.tsx`
- `components/dashboard/ActivityCard.tsx`
- `components/dashboard/ActivityList.tsx`
- `components/dashboard/AddEventTabs.tsx`
- `components/dashboard/AddWeekendPlanDialog.tsx`
- `components/dashboard/DayEventsCard.tsx`
- `components/dashboard/EventCard.tsx`
- `components/dashboard/EventDialog.tsx`
- `components/dashboard/EventFilters.tsx`
- `components/dashboard/EventList.tsx`
- `components/dashboard/EventsMonthSection.tsx`
- `components/dashboard/EventsWeekSection.tsx`
- `components/dashboard/FestivalEventCard.tsx`
- `components/dashboard/FestivalEventDemo.tsx`
- `components/dashboard/ICSImportDialog.tsx`
- `components/dashboard/MegaEventCard.tsx`
- `components/dashboard/OneOffEventsTab.tsx`
- `components/dashboard/PdfUploadButton.tsx`
- `components/dashboard/PdfUploadDemo.tsx`
- `components/dashboard/PdfUploadSection.tsx`
- `components/dashboard/PersonalEventsEmptyState.tsx`
- `components/dashboard/PlanCard.tsx`
- `components/dashboard/SchoolCodeSection.tsx`
- `components/dashboard/ThemedButton.tsx`
- `components/dashboard/ThemedCard.tsx`
- `components/dashboard/TodaysEventsSection.tsx`
- `components/dashboard/TodoChecklist.tsx`
- `components/dashboard/UnauthenticatedDashboard.tsx`
- `components/dashboard/WelcomeBanner.tsx`
- `components/dashboard/WelcomeSection.tsx`
- `components/dashboard/tabs/ActivitiesTab.tsx`
- `components/dashboard/tabs/EventsTab.tsx`
- `components/dashboard/tabs/OneOffEventsTab.tsx`
- `components/dashboard/tabs/PersonalEventsTab.tsx`
- `components/dashboard/tabs/PlaceholderTab.tsx`
- `components/dashboard/tabs/RecurringEventsTab.tsx`
- `components/dashboard/tabs/SchoolEventsTab.tsx`
- `components/dashboard/tabs/SharingTab.tsx`
- `components/dashboard/tabs/UnifiedViewTab.tsx`

### Components — Auth & Profile
- `components/auth/AuthModal.tsx`
- `components/auth/InterestSelectionModal.tsx`
- `components/auth/OnboardingComplete.tsx`
- `components/auth/OnboardingFlow.tsx`
- `components/auth/RoleSelectionModal.tsx`
- `components/auth/SchoolCodeEntry.tsx`
- `components/profile/ChildProfileSelector.tsx`
- `components/profile/EnhancedProfileSelector.tsx`
- `components/profile/ManageProfilesDialog.tsx`

### Components — Schools
- `components/schools/SchoolDiscoverySection.tsx`
- `components/schools/SchoolsManagement.tsx`
- `components/schools/term-dates-wizard/index.ts`
- `components/schools/term-dates-wizard/mockTermDatesData.ts`
- `components/schools/term-dates-wizard/Step1WebsiteDiscovery.tsx`
- `components/schools/term-dates-wizard/Step2TermDatesPage.tsx`
- `components/schools/term-dates-wizard/Step3EventsReview.tsx`
- `components/schools/term-dates-wizard/TermDatesWizard.tsx`
- `components/schools/term-dates-wizard/useWizardState.ts`
- `components/schools/term-dates-wizard/WizardProgress.tsx`

### Components — Sharing
- `components/sharing/ConnectionSharingModal.tsx`
- `components/sharing/EnterShareCodeModal.tsx`
- `components/sharing/MyConnections.tsx`
- `components/sharing/PendingApprovals.tsx`
- `components/shared/ConnectWithTeacherButton.tsx`
- `components/shared/IntegratedSchoolsRoller.tsx`

### Components — Donation & Feedback
- `components/donation/DonationBanner.tsx`
- `components/donation/DonationCard.tsx`
- `components/donation/DonationModal.tsx`
- `components/feedback/FeedbackDialog.tsx`
- `components/feedback/FeedbackFAB.tsx`
- `components/feedback/FeedbackForm.tsx`

### Components — Landing
- `components/landing/EventsTestimonialsBanner.tsx`
- `components/landing/GlobalReachMap.tsx`
- `components/landing/SimpleGlobalReach.tsx`
- `components/landing/TestimonialsBanner.tsx`

### Components — Analytics & ICS
- `components/analytics/RouteTracker.tsx`
- `components/ics/ICSImportComponent.tsx`

### Components — UI (shadcn, all shared)
- `components/ui/accordion.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/alert.tsx`
- `components/ui/aspect-ratio.tsx`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/breadcrumb.tsx`
- `components/ui/button.tsx`
- `components/ui/calendar.tsx`
- `components/ui/card.tsx`
- `components/ui/carousel.tsx`
- `components/ui/chart.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/command.tsx`
- `components/ui/context-menu.tsx`
- `components/ui/dialog.tsx`
- `components/ui/drawer.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/form.tsx`
- `components/ui/hover-card.tsx`
- `components/ui/input-otp.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/menubar.tsx`
- `components/ui/MultiSelect.tsx`
- `components/ui/navigation-menu.tsx`
- `components/ui/pagination.tsx`
- `components/ui/popover.tsx`
- `components/ui/progress.tsx`
- `components/ui/radio-group.tsx`
- `components/ui/resizable.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/select.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/SignInPrompt.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/slider.tsx`
- `components/ui/sonner.tsx`
- `components/ui/switch.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/textarea.tsx`
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/toggle.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/use-toast.ts`
- `components/ui/YearGroupMultiSelect.tsx`
