import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';

export function FeedbackFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          aria-label="Send feedback"
        >
          <span className="text-xl">💬</span>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Send Feedback
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
} 