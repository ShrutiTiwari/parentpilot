import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { schoolDiscoveryService } from '@/services/schoolDiscoveryService';
import type { ExtractedEvent } from '@/services/schoolDiscoveryService';
import type { CreatedSchool } from './useWizardState';


interface Step3Props {
  createdSchool: CreatedSchool;
  confirmedTermDatesPageUrl: string;
  extractedEvents: ExtractedEvent[];
  setExtractedEvents: (events: ExtractedEvent[]) => void;
  rawDataSample: string;
  setRawDataSample: (sample: string) => void;
  extractingTermDates: boolean;
  setExtractingTermDates: (loading: boolean) => void;
  savingEvents: boolean;
  setSavingEvents: (saving: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function Step3EventsReview({
  createdSchool,
  confirmedTermDatesPageUrl,
  extractedEvents,
  setExtractedEvents,
  rawDataSample,
  setRawDataSample,
  extractingTermDates,
  setExtractingTermDates,
  savingEvents,
  setSavingEvents,
  error,
  setError,
  onBack,
  onComplete,
}: Step3Props) {
  // Use local state to avoid localStorage sync issues
  const [localExtractedEvents, setLocalExtractedEvents] = useState<ExtractedEvent[]>(extractedEvents || []);
  const [localRawDataSample, setLocalRawDataSample] = useState<string>(rawDataSample || '');

  console.log('Step3 render - localExtractedEvents:', localExtractedEvents);
  console.log('Step3 render - localExtractedEvents length:', localExtractedEvents?.length);
  console.log('Step3 render - extractingTermDates:', extractingTermDates);
  console.log('Step3 render - savingEvents:', savingEvents);

  // Sync local state with props when props change
  useEffect(() => {
    if (extractedEvents && extractedEvents.length > 0 && localExtractedEvents.length === 0) {
      setLocalExtractedEvents(extractedEvents);
    }
  }, [extractedEvents]);

  // Extract events on mount
  useEffect(() => {
    console.log('Step3 useEffect - checking conditions:', {
      localExtractedEventsLength: localExtractedEvents.length,
      extractedEventsLength: extractedEvents.length,
      extractingTermDates
    });
    if (localExtractedEvents.length === 0 && extractedEvents.length === 0 && !extractingTermDates) {
      console.log('Step3 - Calling extractTermDates');
      extractTermDates();
    }
  }, []);

  const extractTermDates = async () => {
    setExtractingTermDates(true);
    setError(null);

    try {
      const result = await schoolDiscoveryService.extractTermDates({
        termDatesPageUrl: confirmedTermDatesPageUrl,
        schoolName: createdSchool.name,
      });

      console.log('Step3 - Extraction result:', result);
      console.log('Step3 - extractedEvents:', result.extractedEvents);
      console.log('Step3 - extractedEvents length:', result.extractedEvents?.length);

      if (result.extractedEvents && result.extractedEvents.length > 0) {
        console.log('Step3 - Setting extracted events:', result.extractedEvents);
        setLocalExtractedEvents(result.extractedEvents);
        setLocalRawDataSample(result.rawData || result.rawDataSample || '');
        setExtractedEvents(result.extractedEvents); // Update parent state too
        setRawDataSample(result.rawData || result.rawDataSample || '');
      } else {
        console.log('Step3 - No events found in result');
        setError('No events found on this page. You can go back and try a different page.');
      }
    } catch (err: any) {
      console.error('Error extracting term dates:', err);
      setError(err.message || 'Failed to extract term dates');
    } finally {
      setExtractingTermDates(false);
    }
  };

  const handleDeleteEvent = (index: number) => {
    const updatedEvents = localExtractedEvents.filter((_, i) => i !== index);
    setLocalExtractedEvents(updatedEvents);
    setExtractedEvents(updatedEvents);
  };

  const handleSaveEvents = async () => {
    if (localExtractedEvents.length === 0) {
      setError('No events to save');
      return;
    }

    setSavingEvents(true);
    setError(null);

    try {
      const result = await schoolDiscoveryService.addEventsToSchool({
        schoolId: createdSchool.id,
        events: localExtractedEvents,
        userId: null, // System-generated events
        termDatesPageUrl: confirmedTermDatesPageUrl,
      });

      if (result.success) {
        onComplete();
      } else {
        throw new Error('Failed to save events');
      }
    } catch (err: any) {
      console.error('Error saving events:', err);
      setError(err.message || 'Failed to save events to school');
    } finally {
      setSavingEvents(false);
    }
  };

  return (
    <>
      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
        {extractingTermDates && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Extracting term dates from page...</p>
            <p className="text-xs text-muted-foreground">This may take 10-15 seconds</p>
          </div>
        )}

        {savingEvents && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Saving events to school...</p>
          </div>
        )}

        {error && !extractingTermDates && !savingEvents && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {localExtractedEvents.length > 0 && !extractingTermDates && !savingEvents && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Events Extracted Successfully!</AlertTitle>
              <AlertDescription>
                <div>These events will be added as public school events visible to all users</div>
                <div className="mt-2 text-xs">
                  <strong>Source:</strong>{' '}
                  <a
                    href={confirmedTermDatesPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    {confirmedTermDatesPageUrl}
                  </a>
                </div>
              </AlertDescription>
            </Alert>

            {/* Debug: Show what text AI read */}
            {localRawDataSample && (
              <details className="text-xs bg-gray-50 border border-gray-200 p-3 rounded">
                <summary className="cursor-pointer font-medium">
                  🔍 Debug: What AI Read (Click to expand)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40 text-xs">
                  {localRawDataSample}
                </pre>
              </details>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localExtractedEvents.map((event, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(idx)}
                          disabled={savingEvents}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!extractingTermDates && !savingEvents && localExtractedEvents.length === 0 && error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Events Found</AlertTitle>
            <AlertDescription>
              The school has been saved. You can go back and try a different page, or complete without events.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={extractingTermDates || savingEvents}>
          ← Back
        </Button>
        {localExtractedEvents.length > 0 ? (
          <Button onClick={handleSaveEvents} disabled={extractingTermDates || savingEvents}>
            {savingEvents ? 'Saving...' : `Save ${localExtractedEvents.length} Events`}
          </Button>
        ) : (
          <Button variant="outline" onClick={onComplete} disabled={extractingTermDates || savingEvents}>
            Complete Without Events
          </Button>
        )}
      </div>
    </>
  );
}
