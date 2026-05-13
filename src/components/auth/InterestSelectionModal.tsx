import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserRole, UserInterest, getAvailableInterests } from "@/types/profile";
import ProfileService from "@/services/profileService";

interface InterestSelectionModalProps {
  open: boolean;
  role: UserRole;
  onInterestsSelected: (interests: UserInterest[]) => void;
  detectedModule?: 'events' | 'music';
}

export function InterestSelectionModal({ 
  open, 
  role,
  onInterestsSelected, 
  detectedModule 
}: InterestSelectionModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const availableInterests = getAvailableInterests(role);

  // Pre-select interest based on detected module
  useEffect(() => {
    if (detectedModule && availableInterests.some(interest => interest.id === detectedModule)) {
      setSelectedInterests([detectedModule]);
    }
  }, [detectedModule, availableInterests]);

  const handleInterestToggle = (interestId: UserInterest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      toast({
        title: "Please select at least one interest",
        description: "Choose what you'd like to track or manage",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update interests in database
      const success = await ProfileService.updateInterests(selectedInterests);
      
      if (!success) {
        throw new Error('Failed to update interests');
      }

      toast({
        title: "Interests updated!",
        description: `We'll personalize your experience around ${selectedInterests.join(', ')}`,
      });

      // Call the success callback
      onInterestsSelected(selectedInterests);
    } catch (error) {
      console.error('Error updating interests:', error);
      toast({
        title: "Error",
        description: "Failed to update your interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'teacher': return 'teacher';
      case 'parent': return 'parent';
      case 'student': return 'student';
      default: return 'user';
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#1EAEDB]">
            What would you like to track?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            As a {getRoleDisplayName(role)}, select the areas you're interested in managing.
            You can always add more later!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {availableInterests.map((interest) => (
            <Card 
              key={interest.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedInterests.includes(interest.id)
                  ? 'ring-2 ring-[#1EAEDB] bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleInterestToggle(interest.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">
                    {interest.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {interest.label}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {interest.description}
                    </p>
                    {detectedModule === interest.id && (
                      <p className="text-[#1EAEDB] text-xs mt-1 font-medium">
                        ✨ Recommended based on how you found us
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div 
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-[#1EAEDB] border-[#1EAEDB] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedInterests.includes(interest.id) && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mb-4">
          Select all that apply • You can change these later in settings
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleContinue}
            disabled={selectedInterests.length === 0 || loading}
            className="bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue ({selectedInterests.length} selected)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}