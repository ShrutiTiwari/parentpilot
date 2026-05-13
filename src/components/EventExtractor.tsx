
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Upload, Calendar, Clock, FileText } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Event {
  title: string;
  date: string;
  time: string;
}

interface ExtractedData {
  events: Event[];
  isLoading: boolean;
}

const EventExtractor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    events: [],
    isLoading: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if the file is a PDF or an image
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type.startsWith('image/')
      ) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid file',
          description: 'Please upload a PDF or an image file.',
          variant: 'destructive',
        });
      }
    }
  };

  const extractEventData = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to extract data from.',
        variant: 'destructive',
      });
      return;
    }

    setExtractedData({ events: [], isLoading: true });

    try {
      // In a real implementation, this would call the Google Cloud Vision API
      // For now, we'll simulate a response with a delay
      setTimeout(() => {
        // Simulate more realistic events with properly formatted dates and times
        const today = new Date();
        const mockEvents = [
          {
            title: 'Parent-Teacher Conference',
            date: format(today, 'MMMM d, yyyy'), // Today
            time: '3:00 PM - 5:00 PM',
          },
          {
            title: 'School Play: Romeo and Juliet',
            date: format(addDays(today, 7), 'MMMM d, yyyy'), // 1 week from now
            time: '7:00 PM - 9:00 PM',
          },
          {
            title: 'Science Fair',
            date: format(addDays(today, 14), 'MMMM d, yyyy'), // 2 weeks from now
            time: '10:00 AM - 2:00 PM',
          },
          {
            title: 'End of Term Assembly',
            date: format(addDays(today, 21), 'MMMM d, yyyy'), // 3 weeks from now
            time: '9:30 AM - 11:00 AM',
          },
          {
            title: 'Sports Day',
            date: format(addDays(today, 30), 'MMMM d, yyyy'), // 1 month from now
            time: '9:00 AM - 3:00 PM',
          }
        ];
        
        setExtractedData({
          events: mockEvents,
          isLoading: false,
        });
        
        toast({
          title: 'Events extracted',
          description: `Successfully extracted ${mockEvents.length} events!`,
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error extracting data:', error);
      setExtractedData({ events: [], isLoading: false });
      toast({
        title: 'Extraction failed',
        description: 'Failed to extract events from the file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Extract Event Details</h2>
        <p className="text-gray-500">Upload a photo or PDF to extract event information</p>
      </div>
      
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <Upload className="w-12 h-12 text-gray-400 mb-2" />
        <Input 
          id="file-upload" 
          type="file" 
          className="hidden"
          onChange={handleFileChange}
          accept="application/pdf,image/*" 
        />
        <label 
          htmlFor="file-upload" 
          className="w-full cursor-pointer"
        >
          <Button variant="secondary" className="w-full mb-2">
            Select File
          </Button>
        </label>
        {file && (
          <div className="text-sm text-gray-500 mt-2">
            Selected: {file.name}
          </div>
        )}
      </div>

      <Button 
        onClick={extractEventData} 
        disabled={!file || extractedData.isLoading}
        className="w-full"
      >
        {extractedData.isLoading ? 'Extracting...' : 'Extract Events'}
      </Button>

      {extractedData.events.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Extracted Events <span className="text-sm font-normal text-gray-500">({extractedData.events.length} total)</span>
          </h3>
          {extractedData.events.map((event, index) => (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-blue-500" size={18} />
                <h4 className="font-medium">{event.title}</h4>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-500" size={16} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-gray-500" size={16} />
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventExtractor;
