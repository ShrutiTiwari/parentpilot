import React, { useState, useRef } from 'react';
import { ThemedButton } from './ThemedButton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, Plus, Camera, Pencil, Calendar as CalendarImportIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '../../config/api';
import { getEventVisibility, setEventVisibility } from '@/utils/eventUtils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Sparkles } from 'lucide-react';
import EventExtractor from '../EventExtractor';
import { convertToInputFormat, parseTimeForInput } from '../../utils/dateUtils';
import { ICSImportComponent } from '../ics/ICSImportComponent';

interface AddEventTabsProps {
  eventType: 'school' | 'personal';
  onExtractSuccess: (extractedData: any | any[]) => void;
  onAddEventClick: () => void;
  className?: string;
  selectedProfile?: any;
  userId?: string;
}

export const AddEventTabs: React.FC<AddEventTabsProps> = ({
  eventType,
  onExtractSuccess,
  onAddEventClick,
  className = '',
  selectedProfile,
  userId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showICSImport, setShowICSImport] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const extractFileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const lastApiCallRef = useRef<number>(0);
  const RETRY_DELAY = 2000; // 2 seconds minimum between attempts

  // Helper to parse date to YYYY-MM-DD
  const parseDate = (dateStr: string) => {
    return convertToInputFormat(dateStr);
  };

  // Helper to parse time to HH:MM (24-hour)
  const parseTime = (timeStr: string) => {
    return parseTimeForInput(timeStr);
  };

  const handleExtractEvent = async (imageFile: File) => {
    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastApiCallRef.current < RETRY_DELAY) {
      toast({
        title: 'Please Wait',
        description: 'Please wait a moment before trying again.',
        variant: 'destructive',
      });
      return;
    }
    lastApiCallRef.current = now;

    setIsExtracting(true);
    setExtractError(null);
    setShowModal(false);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await fetch(`${API_BASE_URL}/api/extract-event`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle different types of errors with appropriate user messages
        if (errorData.type === 'extraction_error') {
          // This is a user-friendly error from our backend
          throw new Error(errorData.error);
        } else if (response.status === 413) {
          throw new Error('File is too large. Please use a file smaller than 10MB.');
        } else if (response.status === 415) {
          throw new Error('Invalid file type. Please upload an image file (JPEG, PNG, etc.).');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request. Please check your file and try again.');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
        } else {
          throw new Error(errorData.error || 'Failed to extract event details. Please try again.');
        }
      }
      
      const data = await response.json();
      
      let events = [];
      if (Array.isArray(data.events)) {
        events = data.events;
      } else if (Array.isArray(data.event)) {
        events = data.event;
      } else if (Array.isArray(data) && data.length === 1 && Array.isArray(data[0].events)) {
        events = data[0].events;
      } else if (data.event) {
        events = [data.event];
      } else {
        throw new Error('No event data received from server');
      }
      
      // Process all events and create an array of formatted events
      const formattedEvents = events.map(event => {
        let time_start = '';
        let time_end = '';
        if (event.time) {
          const timeParts = event.time.split('-').map((t: string) => t.trim());
          time_start = parseTime(timeParts[0] || '');
          time_end = parseTime(timeParts[1] || '');
        } else {
          time_start = parseTime(event.time_start || '');
          time_end = parseTime(event.time_end || '');
        }
        return {
          title: event.title || '',
          date: event.date || '',
          category: (event.category || '').toLowerCase(),
          yearGroup: event.yearGroup || '',
          event_type: event.event_type || eventType,
          visibility: 'private',
          time_start,
          time_end,
          venue: event.venue || '',
          todos: Array.isArray(event.todos) ? event.todos : [],
          created_by_user_id: eventType === 'personal' ? userId : null,
          school_id: eventType === 'school' && selectedProfile ? selectedProfile.school_id : null,
        };
      });
      
      // Call onExtractSuccess once with the full array of events
      onExtractSuccess(formattedEvents);
      
      toast({
        title: 'Success',
        description: `Successfully extracted ${events.length} event${events.length > 1 ? 's' : ''}!`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error extracting event:', error);
      
      // Set the error message for display in the modal
      setExtractError(error.message || 'Failed to extract event details');
      
      // Show appropriate toast based on error type
      const errorMessage = error.message || 'Failed to extract event details';
      
      if (errorMessage.includes('Image processing was refused') || 
          errorMessage.includes('PDF processing was refused') ||
          errorMessage.includes('Please try with a different image') ||
          errorMessage.includes('Please try with a different PDF') ||
          errorMessage.includes('Please try with a different file')) {
        toast({
          title: 'File Not Suitable',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMessage.includes('Service is temporarily busy') ||
                 errorMessage.includes('Temporary service issue')) {
        toast({
          title: 'Service Busy',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMessage.includes('Service configuration error')) {
        toast({
          title: 'Service Error',
          description: 'There was a configuration issue. Please contact support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUploadClick = () => {
    setShowModal(false);
    extractFileInputRef.current?.click();
  };

  const handleManualClick = () => {
    setShowModal(false);
    onAddEventClick();
  };

  const handleICSImportComplete = (eventCount: number) => {
    setShowICSImport(false);
    toast({
      title: 'Success',
      description: `Successfully imported ${eventCount} calendar events!`,
      variant: 'default',
    });
  };

  return (
    <>
      <div className={`flex flex-col gap-2 ${className}`}>
        <Button
          onClick={() => setShowModal(true)}
          disabled={isExtracting}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          {isExtracting ? 'Processing…' : 'Add New Event'}
        </Button>

        <Button
          onClick={() => setShowICSImport(true)}
          className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md rounded-xl"
        >
          <CalendarImportIcon className="h-4 w-4 mr-1.5" />
          Import Calendar
        </Button>
      </div>

      {/* Modal with two options */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto p-0 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
            <DialogTitle className="text-sm font-semibold text-gray-700">
              Add event
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose how to add your event
            </DialogDescription>
          </div>

          <div className="px-4 py-3 space-y-2">
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
            >
              <Camera className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">Upload screenshot</p>
                <p className="text-xs text-gray-400 mt-0.5">AI extracts event details automatically</p>
              </div>
            </button>

            <button
              onClick={handleManualClick}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left group"
            >
              <Pencil className="h-5 w-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">Create manually</p>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the event details yourself</p>
              </div>
            </button>
          </div>

          {extractError && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-medium text-red-800">Extraction failed</p>
              <p className="text-xs text-red-700 mt-0.5">{extractError}</p>
              <div className="mt-2 flex gap-3">
                <button onClick={() => { setExtractError(null); setShowModal(true); }} className="text-xs text-red-600 hover:text-red-800 underline">Try again</button>
                <button onClick={() => { setExtractError(null); onAddEventClick(); }} className="text-xs text-red-600 hover:text-red-800 underline">Create manually</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={extractFileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleExtractEvent(file);
          }
        }}
      />

      {/* ICS Import Dialog */}
      <Dialog open={showICSImport} onOpenChange={setShowICSImport}>
        <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">
            Import Calendar Events
          </DialogTitle>
          <DialogDescription className="sr-only">
            Import events from an ICS calendar URL
          </DialogDescription>

          <ICSImportComponent
            onImportComplete={handleICSImportComplete}
            defaultSchoolId={eventType === 'school' && selectedProfile ? selectedProfile.school_id : undefined}
            showSchoolSelector={eventType === 'school'}
          />

          <div className="flex justify-end mt-6">
            <ThemedButton
              variant="outline"
              onClick={() => setShowICSImport(false)}
              className="px-8 py-2"
            >
              Close
            </ThemedButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
