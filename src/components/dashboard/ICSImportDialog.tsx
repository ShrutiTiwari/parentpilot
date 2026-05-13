import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ICSImportComponent } from '../ics/ICSImportComponent';
import { useChildProfiles } from '@/contexts/ChildProfileContext';

interface ICSImportDialogProps {
  onImportComplete?: () => void;
}

export function ICSImportDialog({ onImportComplete }: ICSImportDialogProps) {
  const [open, setOpen] = useState(false);
  const { selectedProfile } = useChildProfiles();

  const handleImportComplete = (eventCount: number) => {
    // Close dialog after successful import
    setTimeout(() => {
      setOpen(false);
      if (onImportComplete) {
        onImportComplete();
      }
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import School Events from Calendar</DialogTitle>
          <DialogDescription>
            Import events from an ICS calendar URL (Google Calendar, Outlook, Apple Calendar, etc.)
          </DialogDescription>
        </DialogHeader>
        <ICSImportComponent
          onImportComplete={handleImportComplete}
          defaultSchoolId={selectedProfile?.schoolId}
          showSchoolSelector={true}
        />
      </DialogContent>
    </Dialog>
  );
}
