import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { schoolDiscoveryService } from '@/services/schoolDiscoveryService';
import type { SchoolData } from './useWizardState';

interface Step1Props {
  schoolData: SchoolData;
  suggestedWebsite: string | null;
  setSuggestedWebsite: (url: string | null) => void;
  websiteConfirmation: 'correct' | 'custom';
  setWebsiteConfirmation: (value: 'correct' | 'custom') => void;
  customWebsiteUrl: string;
  setCustomWebsiteUrl: (url: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onNext: (websiteUrl: string) => void;
  onSkip: () => void;
}

export function Step1WebsiteDiscovery({
  schoolData,
  suggestedWebsite,
  setSuggestedWebsite,
  websiteConfirmation,
  setWebsiteConfirmation,
  customWebsiteUrl,
  setCustomWebsiteUrl,
  loading,
  setLoading,
  error,
  setError,
  onNext,
  onSkip,
}: Step1Props) {
  // Discover website on mount (skip if website URL already provided)
  useEffect(() => {
    if (schoolData.websiteUrl) {
      // Website already known, set it as suggested
      setSuggestedWebsite(schoolData.websiteUrl);
    } else if (!suggestedWebsite && !loading) {
      discoverWebsite();
    }
  }, []);

  const discoverWebsite = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await schoolDiscoveryService.discoverWebsite({
        schoolName: schoolData.schoolName,
        city: schoolData.city,
        country: schoolData.country,
      });

      if (result.suggestedUrl) {
        setSuggestedWebsite(result.suggestedUrl);
      } else {
        setError('Could not find school website automatically. Please enter it manually.');
        setWebsiteConfirmation('custom');
      }
    } catch (err: any) {
      console.error('Error discovering website:', err);
      setError(err.message || 'Failed to discover school website');
      setWebsiteConfirmation('custom');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const confirmedUrl = websiteConfirmation === 'correct' ? suggestedWebsite : customWebsiteUrl;
    if (!confirmedUrl) {
      setError('Please enter a website URL');
      return;
    }
    onNext(confirmedUrl);
  };

  const confirmedUrl = websiteConfirmation === 'correct' ? suggestedWebsite : customWebsiteUrl;

  return (
    <>
      <div className="space-y-4 py-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching for school website...</p>
          </div>
        )}

        {error && !suggestedWebsite && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestedWebsite && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Website Found!</AlertTitle>
              <AlertDescription>
                <a
                  href={suggestedWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  {suggestedWebsite}
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Is this the correct school website?</Label>
              <RadioGroup
                value={websiteConfirmation}
                onValueChange={(value) => setWebsiteConfirmation(value as 'correct' | 'custom')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="correct" id="correct" />
                  <Label htmlFor="correct" className="cursor-pointer font-normal">
                    Yes, this is correct
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer font-normal">
                    No, use a different URL
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {websiteConfirmation === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customWebsite">Enter correct website URL</Label>
                <Input
                  id="customWebsite"
                  type="url"
                  placeholder="https://www.schoolname.com"
                  value={customWebsiteUrl}
                  onChange={(e) => setCustomWebsiteUrl(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !suggestedWebsite && error && (
          <div className="space-y-2">
            <Label htmlFor="manualWebsite">Enter school website URL</Label>
            <Input
              id="manualWebsite"
              type="url"
              placeholder="https://www.schoolname.com"
              value={customWebsiteUrl}
              onChange={(e) => setCustomWebsiteUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip}>
          Skip Term Dates Import
        </Button>
        <Button onClick={handleNext} disabled={!confirmedUrl || loading}>
          Next: Find Term Dates →
        </Button>
      </div>
    </>
  );
}
