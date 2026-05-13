import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { DonationCard } from './DonationCard';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'milestone' | 'manual' | 'feature_use';
  customMessage?: string;
}

export function DonationModal({ 
  open, 
  onOpenChange,
  trigger = 'manual',
  customMessage 
}: DonationModalProps) {
  
  const getTriggerMessage = () => {
    switch (trigger) {
      case 'milestone':
        return "🎉 Congratulations! You've been making great progress with your music practice. Consider supporting the project to help us add more features!";
      case 'feature_use':
        return "💡 Enjoying this feature? Your support helps us maintain and improve PowerParent for all families learning music.";
      default:
        return customMessage || "This project is independent and currently free to use. If you've found it helpful, consider supporting its development.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-md">
        <div className="relative">
          <DonationCard 
            variant="modal"
            showCloseButton={true}
            onClose={() => onOpenChange(false)}
            className="animate-in zoom-in-95 duration-300"
          />
          {trigger !== 'manual' && (
            <div className="absolute -top-3 left-4 right-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full text-center">
                {getTriggerMessage()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DonationModal;