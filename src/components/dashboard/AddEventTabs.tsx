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
      
      console.log('AddEventTabs: Raw response data:', data);
      console.log('AddEventTabs: data.events:', data.events);
      console.log('AddEventTabs: Array.isArray(data.events):', Array.isArray(data.events));
      
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
      console.log('AddEventTabs: Raw events from backend:', events);
      console.log('AddEventTabs: events.length:', events.length);
      
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
      
      console.log('Formatted events array:', formattedEvents);
      
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
      <div className={`bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-xl border-2 border-green-200/50 p-4 sm:p-6 shadow-lg h-full flex flex-col justify-center ${className}`}>
        <div className="space-y-3">
          <ThemedButton
            onClick={() => setShowModal(true)}
            disabled={isExtracting}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            <Plus className="h-6 w-6 mr-3" />
            {isExtracting ? 'Processing...' : 'Add New Event'}
          </ThemedButton>

          <ThemedButton
            onClick={() => setShowICSImport(true)}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            <CalendarImportIcon className="h-6 w-6 mr-3" />
            Import Calendar
          </ThemedButton>
        </div>
      </div>

      {/* Modal with two options */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogTitle className="text-xl font-semibold text-center mb-2">
            How would you like to add an event?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose how to add your event
          </DialogDescription>
          
          <div className="space-y-4 mt-6">
            {/* Upload Screenshot Option */}
            <button
              onClick={handleUploadClick}
              className="w-full p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Camera className="h-8 w-8 text-gray-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                    Upload a Screenshot
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    AI will extract event details from your screenshot
                  </p>
                </div>
              </div>
            </button>

            {/* Create Manually Option */}
            <button
              onClick={handleManualClick}
              className="w-full p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Pencil className="h-8 w-8 text-gray-600 group-hover:text-green-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-900 transition-colors">
                    Create Manually
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Use a simple form to add the event yourself
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-center mt-8">
            <ThemedButton
              variant="outline"
              onClick={() => setShowModal(false)}
              className="px-8 py-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel
            </ThemedButton>
          </div>

          {extractError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">
                    {extractError.includes('Image processing was refused') || 
                     extractError.includes('PDF processing was refused') ||
                     extractError.includes('Please try with a different image') ||
                     extractError.includes('Please try with a different PDF') ||
                     extractError.includes('Please try with a different file') ? 'File Not Suitable' :
                     extractError.includes('Service is temporarily busy') ? 'Service Busy' :
                     extractError.includes('Service configuration error') ? 'Service Error' :
                     'Extraction Failed'}
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {extractError}
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setExtractError(null);
                        setShowModal(true);
                      }}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => {
                        setExtractError(null);
                        onAddEventClick();
                      }}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Create Manually Instead
                    </button>
                  </div>
                </div>
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
