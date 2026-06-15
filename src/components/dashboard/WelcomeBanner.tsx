import React from 'react';
import { ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getVisibilityOptions } from '../../utils/eventVisibilityUtils';

interface WelcomeBannerProps {
  collapsed: boolean;
  onToggle: () => void;
  eventCount?: number;
}

export function WelcomeBanner({ collapsed, onToggle, eventCount = 0 }: WelcomeBannerProps) {
  return (
    <div
      className="flex items-center justify-between mb-3 cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-700">
            Family calendar
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${eventCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {eventCount} <span className="font-normal opacity-75">upcoming</span>
            </span>
          </h2>
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={e => e.stopPropagation()}
            >
              Learn more ▸
            </button>
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
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 hidden sm:block mr-1">Private by default. You control visibility.</span>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-gray-400" />
          : <ChevronUp className="w-4 h-4 text-gray-400" />
        }
      </div>
    </div>
  );
}
