import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles } from "lucide-react";
import { UserRole, UserInterest } from "@/types/profile";

interface OnboardingCompleteProps {
  open: boolean;
  role: UserRole;
  interests: UserInterest[];
  onGetStarted: () => void;
}

export function OnboardingComplete({ 
  open, 
  role, 
  interests, 
  onGetStarted 
}: OnboardingCompleteProps) {
  
  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  const getInterestDisplayName = (interest: UserInterest) => {
    switch (interest) {
      case 'events': return 'School Events';
      case 'music': return 'Music Practice';
      case 'academics': return 'Homework & Studies';
      case 'activities': return 'Sports & Activities';
      default: return interest;
    }
  };

  const getWelcomeMessage = (role: UserRole) => {
    switch (role) {
      case 'teacher':
        return "You're all set to track your students' progress and manage classroom activities!";
      case 'parent':
        return "You're ready to stay on top of your children's activities and progress!";
      case 'student':
        return "You're all set to track your own learning journey and activities!";
      default:
        return "You're all set to get started!";
    }
  };

  const getNextSteps = (role: UserRole, interests: UserInterest[]) => {
    const steps = [];
    
    if (role === 'teacher') {
      if (interests.includes('events')) {
        steps.push("Create student profiles and manage school events");
      }
      if (interests.includes('music')) {
        steps.push("Set up music students and track their practice");
      }
      if (interests.includes('academics')) {
        steps.push("Assign homework and monitor student progress");
      }
    } else if (role === 'parent') {
      if (interests.includes('events')) {
        steps.push("Add your children and connect with their schools");
      }
      if (interests.includes('music')) {
        steps.push("Track your child's music practice progress");
      }
      if (interests.includes('activities')) {
        steps.push("Manage sports and extracurricular activities");
      }
    } else if (role === 'student') {
      if (interests.includes('music')) {
        steps.push("Log your music practice sessions");
      }
      if (interests.includes('academics')) {
        steps.push("Track your homework and study progress");
      }
      if (interests.includes('activities')) {
        steps.push("Monitor your activities and achievements");
      }
    }

    return steps.length > 0 ? steps : ["Explore the platform and discover all features"];
  };

  const nextSteps = getNextSteps(role, interests);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <Sparkles className="h-6 w-6 text-[#1EAEDB] absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-[#1EAEDB]">
            Welcome to Power Parent!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {getWelcomeMessage(role)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Profile Summary */}
          <Card className="bg-blue-50 border-[#1EAEDB]/20">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Your Profile</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">
                      {role === 'teacher' ? '👩‍🏫' : role === 'parent' ? '👨‍👩‍👧‍👦' : '🎓'}
                    </span>
                    <span className="font-medium">{getRoleDisplayName(role)}</span>
                  </div>
                  {interests.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Interested in: {interests.map(getInterestDisplayName).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">What's next?</h3>
              <div className="space-y-2">
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-[#1EAEDB] text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={onGetStarted}
          className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90"
          size="lg"
        >
          Get Started
        </Button>

        <p className="text-xs text-center text-gray-500 mt-2">
          You can always change your role and interests in settings
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingComplete;