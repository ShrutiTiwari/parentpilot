import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '../../config/api';

interface PdfUploadButtonProps {
  onExtractSuccess: (extractedData: any | any[]) => void;
  className?: string;
  disabled?: boolean;
  selectedProfile?: any;
  userId?: string;
  eventType: 'school' | 'personal';
}

export const PdfUploadButton: React.FC<PdfUploadButtonProps> = ({
  onExtractSuccess,
  className = '',
  disabled = false,
  selectedProfile,
  userId,
  eventType
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handlePdfUpload = async (pdfFile: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', pdfFile); // Using 'image' field name for consistency with backend
      
      const response = await fetch(`${API_BASE_URL}/api/extract-event`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.type === 'extraction_error') {
          throw new Error(errorData.error);
        } else if (response.status === 413) {
          throw new Error('PDF file is too large. Please use a file smaller than 10MB.');
        } else if (response.status === 415) {
          throw new Error('Invalid file type. Please upload a PDF file.');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request. Please check your file and try again.');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
        } else {
          throw new Error(errorData.error || 'Failed to extract event details from PDF. Please try again.');
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
        throw new Error('No event data received from PDF');
      }
      
      // Process extracted events and create an array of formatted events
      const formattedEvents = events.map(event => ({
        title: event.title || '',
        date: event.date || '',
        category: (event.category || '').toLowerCase(),
        yearGroup: event.yearGroup || '',
        event_type: event.event_type || 'personal',
        visibility: 'private',
        time_start: event.time_start || '',
        time_end: event.time_end || '',
        venue: event.venue || '',
        todos: Array.isArray(event.todos) ? event.todos : [],
        created_by_user_id: eventType === 'personal' ? userId : null,
        school_id: eventType === 'school' && selectedProfile ? selectedProfile.school_id : null,
      }));
      
      // Call onExtractSuccess once with the full array of events
      onExtractSuccess(formattedEvents);
      
      toast({
        title: 'PDF Processing Successful',
        description: `Successfully extracted ${events.length} event${events.length > 1 ? 's' : ''} from PDF!`,
        variant: 'default',
      });
      
    } catch (error: any) {
      console.error('Error extracting events from PDF:', error);
      
      // Set the error message for display
      setUploadError(error.message || 'Failed to extract event details from PDF');
      
      // Show appropriate toast based on error type
      const errorMessage = error.message || 'Failed to extract event details from PDF';
      
      if (errorMessage.includes('PDF processing was refused') ||
          errorMessage.includes('Please try with a different PDF') ||
          errorMessage.includes('Please try with a different file')) {
        toast({
          title: 'PDF Not Suitable',
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
          title: 'PDF Extraction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <div className={`bg-gradient-to-r from-purple-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border-2 border-purple-200/50 p-4 sm:p-6 shadow-lg h-full flex flex-col justify-center ${className}`}>
        <div className="text-center">
          <Button
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Processing PDF...
              </>
            ) : (
              <>
                <FileText className="h-6 w-6 mr-3" />
                Upload PDF Schedule
              </>
            )}
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Extract events from school PDF schedules
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handlePdfUpload(file);
          }
        }}
      />

      {/* Error display */}
      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">
                PDF Processing Failed
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {uploadError}
              </p>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setUploadError(null);
                    fileInputRef.current?.click();
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 