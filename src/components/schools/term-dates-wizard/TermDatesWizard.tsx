import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WizardProgress } from './WizardProgress';
import { Step1WebsiteDiscovery } from './Step1WebsiteDiscovery';
import { Step2TermDatesPage } from './Step2TermDatesPage';
import { Step3EventsReview } from './Step3EventsReview';
import { useWizardState, type SchoolData, type CreatedSchool } from './useWizardState';

interface TermDatesWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolData: SchoolData;
  onComplete: (createdSchool: CreatedSchool | null) => void;
}

export function TermDatesWizard({ open, onOpenChange, schoolData, onComplete }: TermDatesWizardProps) {
  const {
    state,
    updateState,
    clearState,
    resetWizard,
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
  } = useWizardState(schoolData);

  // Reset wizard when opening with new school data
  useEffect(() => {
    if (open && schoolData?.schoolName) {
      // Always reset wizard to ensure fresh school creation and website URL saving
      resetWizard();
      updateState({
        schoolData,
        wizardStep: 1,
        suggestedPages: [],
        selectedPageUrl: '',
        extractedEvents: []
      });
    }
  }, [open, schoolData?.schoolName]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSkipImport = () => {
    clearState();
    onComplete(null);
    handleClose();
  };

  // Step 1 handlers
  const handleStep1Next = (websiteUrl: string) => {
    updateState({
      confirmedWebsiteUrl: websiteUrl,
      wizardStep: 2,
    });
  };

  // Step 2 handlers
  const handleStep2Back = () => {
    updateState({ wizardStep: 1 });
  };

  const handleStep2Next = (termDatesPageUrl: string, createdSchool: CreatedSchool) => {
    updateState({
      confirmedTermDatesPageUrl: termDatesPageUrl,
      createdSchool,
      wizardStep: 3,
    });
  };

  // Step 3 handlers
  const handleStep3Back = () => {
    updateState({ wizardStep: 2 });
  };

  const handleStep3Complete = () => {
    const school = state.createdSchool;
    clearState();
    onComplete(school);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WizardProgress currentStep={state.wizardStep} />

        {/* Step 1: Website Discovery */}
        {state.wizardStep === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Find School Website</DialogTitle>
              <DialogDescription>
                We'll search for {schoolData.schoolName}'s official website
              </DialogDescription>
            </DialogHeader>

            <Step1WebsiteDiscovery
              schoolData={schoolData}
              suggestedWebsite={state.suggestedWebsite}
              setSuggestedWebsite={(url) => updateState({ suggestedWebsite: url })}
              websiteConfirmation={state.websiteConfirmation}
              setWebsiteConfirmation={(value) => updateState({ websiteConfirmation: value })}
              customWebsiteUrl={state.customWebsiteUrl}
              setCustomWebsiteUrl={(url) => updateState({ customWebsiteUrl: url })}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              onNext={handleStep1Next}
              onSkip={handleSkipImport}
            />
          </>
        )}

        {/* Step 2: Term Dates Page Discovery */}
        {state.wizardStep === 2 && state.confirmedWebsiteUrl && (
          <>
            {              }}
              selectedPageUrl={state.selectedPageUrl}
              setSelectedPageUrl={(url) => updateState({ selectedPageUrl: url })}
              customPageUrl={state.customPageUrl}
              setCustomPageUrl={(url) => updateState({ customPageUrl: url })}
              loadingTermDatesPage={loadingTermDatesPage}
              setLoadingTermDatesPage={setLoadingTermDatesPage}
              savingSchool={savingSchool}
              setSavingSchool={setSavingSchool}
              error={error}
              setError={setError}
              onBack={handleStep2Back}
              onNext={handleStep2Next}
              onSkip={handleSkipImport}
            />
          </>
        )}

        {/* Step 3: Extract & Review Events */}
        {state.wizardStep === 3 && state.createdSchool && state.confirmedTermDatesPageUrl && (
          <>
            <DialogHeader>
              <DialogTitle>Review Extracted Term Dates</DialogTitle>
              <DialogDescription>
                Extracting events from the school calendar...
              </DialogDescription>
            </DialogHeader>

            <Step3EventsReview
              createdSchool={state.createdSchool}
              confirmedTermDatesPageUrl={state.confirmedTermDatesPageUrl}
              extractedEvents={state.extractedEvents}
              setExtractedEvents={(events) => updateState({ extractedEvents: events })}
              rawDataSample={state.rawDataSample}
              setRawDataSample={(sample) => updateState({ rawDataSample: sample })}
              extractingTermDates={extractingTermDates}
              setExtractingTermDates={setExtractingTermDates}
              savingEvents={savingEvents}
              setSavingEvents={setSavingEvents}
              error={error}
              setError={setError}
              onBack={handleStep3Back}
              onComplete={handleStep3Complete}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
