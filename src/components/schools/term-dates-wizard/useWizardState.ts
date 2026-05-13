import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ExtractedEvent } from '@/services/schoolDiscoveryService';

export interface SchoolData {
  schoolName: string;
  city?: string;
  country?: string;
  address?: string;
  existingSchoolId?: string; // For resuming term dates import for existing schools
  websiteUrl?: string; // Pre-filled website URL for existing schools
}

export interface CreatedSchool {
  id: string;
  name: string;
  schoolCode: string;
  city?: string;
  country?: string;
  address?: string;
  termDatesUrl?: string;
}

export interface WizardState {
  // School info
  schoolData: SchoolData | null;

  // Step 1: Website discovery
  suggestedWebsite: string | null;
  websiteConfirmation: 'correct' | 'custom';
  customWebsiteUrl: string;
  confirmedWebsiteUrl: string | null;

  // Step 2: Term dates page discovery
  suggestedPages: any[];
  selectedPageUrl: string;
  customPageUrl: string;
  confirmedTermDatesPageUrl: string | null;

  // Step 3: Events extraction
  extractedEvents: ExtractedEvent[];
  rawDataSample: string;

  // Created school (after step 2)
  createdSchool: CreatedSchool | null;

  // Current step
  wizardStep: 1 | 2 | 3;
}

const initialState: WizardState = {
  schoolData: null,
  suggestedWebsite: null,
  websiteConfirmation: 'correct',
  customWebsiteUrl: '',
  confirmedWebsiteUrl: null,
  suggestedPages: [],
  selectedPageUrl: '',
  customPageUrl: '',
  confirmedTermDatesPageUrl: null,
  extractedEvents: [],
  rawDataSample: '',
  createdSchool: null,
  wizardStep: 1,
};

export function useWizardState(schoolData: SchoolData | null) {
  const [state, setState, clearState] = useLocalStorage<WizardState>(
    'wizard-term-dates-import',
    initialState,
    24 // 24 hours expiration
  );

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingTermDatesPage, setLoadingTermDatesPage] = useState(false);
  const [extractingTermDates, setExtractingTermDates] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingEvents, setSavingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update specific parts of state
  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Reset wizard
  const resetWizard = () => {
    setState(initialState);
    setError(null);
  };

  // Check if we should resume from saved state
  const canResume = state.schoolData?.schoolName === schoolData?.schoolName && state.wizardStep > 1;

  return {
    // State
    state,
    updateState,
    resetWizard,
    clearState,
    canResume,

    // Loading states
    loading,
    setLoading,
    loadingTermDatesPage,
    setLoadingTermDatesPage,
    extractingTermDates,
    setExtractingTermDates,
    savingSchool,
    setSavingSchool,
    savingEvents,
    setSavingEvents,
    error,
    setError,
  };
}
