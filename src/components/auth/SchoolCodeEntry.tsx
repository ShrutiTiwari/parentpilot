import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { schoolAuthorizationService } from '@/services/schoolAuthorizationService';
import { useToast } from "@/components/ui/use-toast";
import { useSchoolAuthorizations } from '@/contexts/SchoolAuthorizationContext';

interface SchoolCodeEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SchoolCodeEntry({ open, onOpenChange, onSuccess }: SchoolCodeEntryProps) {
  const [loading, setLoading] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
  const { toast } = useToast();
  const { refreshAuthorizations } = useSchoolAuthorizations();

  console.log('SchoolCodeEntry rendered with open:', open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting school code:', schoolCode);

    try {
      const { isNew } = await schoolAuthorizationService.validateAndAuthorize(schoolCode);
      console.log('School code validation result:', isNew ? 'New access granted' : 'Already had access');
      
      // Always refresh authorizations
      await refreshAuthorizations();
      
      toast({
        title: "Success",
        description: isNew ? "School access granted" : "School access confirmed",
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error validating school code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to validate school code',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log('Dialog onOpenChange:', newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter School Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolCode">School Code</Label>
            <Input
              id="schoolCode"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit school code"
              maxLength={6}
              required
              className="text-center tracking-widest text-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {
              console.log('Cancel button clicked');
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || schoolCode.length !== 6}>
              {loading ? 'Validating...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 