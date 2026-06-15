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
    const now = Date.now();
    if (now - lastApiCallRef.current < RETRY_DELAY) {
      toast({ title: 'Please Wait', description: 'Please wait a moment before trying again.', variant: 'destructive' });
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
        throw new Error(errorData.error || 'Failed to extract event details. Please try again.');
      }

      const data = await response.json();
      let events = Array.isArray(data.events) ? data.events : data.event ? [data.event] : [];
      if (!events.length) throw new Error('No event data received from server');

      onExtractSuccess(events);

      toast({
        title: 'Success',
        description: `Successfully extracted ${events.length} event${events.length > 1 ? 's' : ''}!`,
      });
    } catch (error: any) {
      setExtractError(error.message || 'Failed to extract event details');
      toast({ title: 'Extraction Failed', description: error.message || 'Failed to extract event details', variant: 'destructive' });
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
