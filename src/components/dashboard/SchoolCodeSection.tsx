import React from 'react';
import { ThemedButton } from './ThemedButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { getVisibilityEmoji } from '../../utils/eventVisibilityUtils';
import { User } from '@supabase/supabase-js';

interface SchoolCodeSectionProps {
  hasSchoolAccess: boolean;
  selectedProfileSchoolName?: string;
  onShowSchoolCodeEntry: () => void;
  user?: User | null;
}

export function SchoolCodeSection({ hasSchoolAccess, selectedProfileSchoolName, onShowSchoolCodeEntry, user }: SchoolCodeSectionProps) {
  const isMobile = useIsMobile();

  // Don't show the school code section if user is not authenticated
  if (!user) {
    return null;
  }

  // Don't show the school code section if no child profile is selected
  if (!selectedProfileSchoolName) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ThemedButton
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
        >
          🔐 Access shared school events
          <span className="ml-2">▸</span>
        </ThemedButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getVisibilityEmoji('verified_shared')}</span>
            <h3 className="font-medium text-sm">Access Shared School Events</h3>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enter your school code to see private events shared by other parents and add new ones to help the community.
          </p>
          
          {!hasSchoolAccess ? (
            <ThemedButton
              variant="outline"
              size="sm"
              onClick={onShowSchoolCodeEntry}
              className="w-full text-xs"
            >
              Enter school code
            </ThemedButton>
          ) : (
            selectedProfileSchoolName && (
              <div className="bg-green-50 border border-green-200 rounded-md p-1.5">
                <p className="text-xs text-green-800">
                  ✓ Connected to <strong>{selectedProfileSchoolName}</strong>
                </p>
              </div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
