import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getVisibilityOptions } from '../../utils/eventVisibilityUtils';

export function WelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-lg border border-blue-200/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-lg mt-0.5">📅</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-blue-900">Welcome to your family calendar!</span>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 h-auto p-1"
                  >
                    Learn more ▸
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      🔒 Your Privacy & Visibility
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      We use simple icons to show who can see each event:
                    </p>
                    
                    {getVisibilityOptions().map(option => (
                      <div key={option.value} className="flex items-start gap-3">
                        <span className="text-lg">{option.emoji}</span>
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-muted-foreground">{option.description}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {option.value === 'private' && "These are your personal events. Nobody else can see them."}
                            {option.value === 'public' && "These events are automatically pulled from the school's public website."}
                            {option.value === 'verified_shared' && "These are internal school events contributed by verified parents or admins."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-sm text-blue-800">
              Private by default. You control visibility.
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-100/50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
