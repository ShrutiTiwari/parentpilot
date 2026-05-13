import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { schoolDiscoveryService } from '@/services/schoolDiscoveryService';
import type { SchoolData, CreatedSchool } from './useWizardState';

interface SuggestedPage {
  url: string;
  title: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

interface Step2Props {
  schoolData: SchoolData;
  confirmedWebsiteUrl: string;
  suggestedPages: SuggestedPage[];
  setSuggestedPages: (pages: SuggestedPage[]) => void;
  selectedPageUrl: string;
  setSelectedPageUrl: (url: string) => void;
  customPageUrl: string;
  setCustomPageUrl: (url: string) => void;
  loadingTermDatesPage: boolean;
  setLoadingTermDatesPage: (loading: boolean) => void;
  savingSchool: boolean;
  setSavingSchool: (saving: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onBack: () => void;
  onNext: (termDatesPageUrl: string, createdSchool: CreatedSchool) => void;
  onSkip: () => void;
}

export function Step2TermDatesPage({
  schoolData,
  confirmedWebsiteUrl,
  suggestedPages,
  setSuggestedPages,
  selectedPageUrl,
  setSelectedPageUrl,
  customPageUrl,
  setCustomPageUrl,
  loadingTermDatesPage,
  setLoadingTermDatesPage,
  savingSchool,
  setSavingSchool,
  error,
  setError,
  onBack,
  onNext,
  onSkip,
}: Step2Props) {
  // Use local state for suggested pages to avoid localStorage sync issues
  const [localSuggestedPages, setLocalSuggestedPages] = useState<SuggestedPage[]>(suggestedPages || []);

  // Sync local state with props when props change
  useEffect(() => {
    if (suggestedPages && suggestedPages.length > 0 && localSuggestedPages.length === 0) {
      setLocalSuggestedPages(suggestedPages);
    }
  }, [suggestedPages]);

  // Discover term dates page on mount
  useEffect(() => {
    if (localSuggestedPages.length === 0 && suggestedPages.length === 0 && !loadingTermDatesPage) {
      discoverTermDatesPage();
    }
  }, []);

  const discoverTermDatesPage = async () => {
    setLoadingTermDatesPage(true);
    setError(null);

    try {
      const result = await schoolDiscoveryService.discoverTermDatesPage({
        schoolWebsiteUrl: confirmedWebsiteUrl,
      });

      if (result.suggestedPages && result.suggestedPages.length > 0) {
        console.log('Setting suggested pages:', result.suggestedPages);
        setLocalSuggestedPages(result.suggestedPages);
        setSuggestedPages(result.suggestedPages); // Still update parent state for persistence
        // Auto-select first high confidence page
        const highConfPage = result.suggestedPages.find((p: SuggestedPage) => p.confidence === 'high');
        if (highConfPage) {
          setSelectedPageUrl(highConfPage.url);
        }
      } else {
        setError('Could not find term dates page automatically. Please enter it manually.');
      }
    } catch (err: any) {
      console.error('Error discovering term dates page:', err);
      setError(err.message || 'Failed to discover term dates page');
    } finally {
      setLoadingTermDatesPage(false);
    }
  };

  const handleNext = async () => {
    const confirmedPageUrl = selectedPageUrl === 'custom' ? customPageUrl : selectedPageUrl;

    if (!confirmedPageUrl) {
      setError('Please select or enter a term dates page URL');
      return;
    }

    // If school already exists, skip creation and proceed directly to step 3
    if (schoolData.existingSchoolId) {
      const existingSchool: CreatedSchool = {
        id: schoolData.existingSchoolId,
        name: schoolData.schoolName,
        schoolCode: '', // Not needed for existing schools
        city: schoolData.city,
        country: schoolData.country,
        address: schoolData.address,
        termDatesUrl: confirmedPageUrl,
      };
      onNext(confirmedPageUrl, existingSchool);
      return;
    }

    // Create school in database before proceeding to step 3
    setSavingSchool(true);
    setError(null);

    try {
      const result = await schoolDiscoveryService.createSchool({
        schoolData: {
          name: schoolData.schoolName,
          city: schoolData.city,
          country: schoolData.country,
          address: schoolData.address,
          websiteUrl: confirmedWebsiteUrl,
          termDatesPageUrl: confirmedPageUrl,
        },
      });

      if (result.school) {
        onNext(confirmedPageUrl, result.school);
      } else {
        throw new Error('Failed to create school');
      }
    } catch (err: any) {
      console.error('Error creating school:', err);
      setError(err.message || 'Failed to save school information');
    } finally {
      setSavingSchool(false);
    }
  };

  const confirmedPageUrl = selectedPageUrl === 'custom' ? customPageUrl : selectedPageUrl;

  // Debug logging
  console.log('Step2 render - localSuggestedPages:', localSuggestedPages);
  console.log('Step2 render - loadingTermDatesPage:', loadingTermDatesPage);
  console.log('Step2 render - savingSchool:', savingSchool);

  return (
    <>
      <div className="space-y-4 py-4">
        {loadingTermDatesPage && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing website for term dates...</p>
          </div>
        )}

        {savingSchool && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Saving school information...</p>
          </div>
        )}

        {error && !loadingTermDatesPage && !savingSchool && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {localSuggestedPages && localSuggestedPages.length > 0 && !loadingTermDatesPage && !savingSchool && (
          <div className="space-y-4">
            <Label>Select the term dates page:</Label>

            <RadioGroup value={selectedPageUrl} onValueChange={setSelectedPageUrl}>
              {localSuggestedPages.map((page, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent">
                  <RadioGroupItem value={page.url} id={`page-${idx}`} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={`page-${idx}`} className="cursor-pointer">
                      <div className="font-medium">{page.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{page.url}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {page.reasoning}
                      </div>
                      <Badge variant={page.confidence === 'high' ? 'default' : 'secondary'} className="mt-2">
                        {page.confidence} confidence
                      </Badge>
                    </Label>
                  </div>
                </div>
              ))}

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="custom" id="custom-url" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="custom-url" className="cursor-pointer font-medium">
                    Use a different URL
                  </Label>
                  {selectedPageUrl === 'custom' && (
                    <Input
                      type="url"
                      placeholder="https://www.school.com/calendar"
                      value={customPageUrl}
                      onChange={(e) => setCustomPageUrl(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {!loadingTermDatesPage && !savingSchool && localSuggestedPages.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor="manualPageUrl">Enter term dates page URL</Label>
            <Input
              id="manualPageUrl"
              type="url"
              placeholder="https://www.school.com/calendar"
              value={customPageUrl}
              onChange={(e) => setCustomPageUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loadingTermDatesPage || savingSchool}>
          ← Back
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={loadingTermDatesPage || savingSchool}>
          Skip Term Dates Import
        </Button>
        <Button onClick={handleNext} disabled={!confirmedPageUrl || loadingTermDatesPage || savingSchool}>
          {savingSchool ? 'Saving...' : 'Extract Term Dates →'}
        </Button>
      </div>
    </>
  );
}
