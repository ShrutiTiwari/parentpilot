import React, { useState } from "react";
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
import { UserRole, ROLE_OPTIONS } from "@/types/profile";
import ProfileService from "@/services/profileService";

interface RoleSelectionModalProps {
  open: boolean;
  onRoleSelected: (role: UserRole) => void;
}

export function RoleSelectionModal({ 
  open, 
  onRoleSelected 
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose the option that best describes you",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update role in database
      const success = await ProfileService.updateRole(selectedRole);
      
      if (!success) {
        throw new Error('Failed to update role');
      }

      toast({
        title: "Role updated!",
        description: `You're now set up as a ${selectedRole}`,
      });

      // Call the success callback
      onRoleSelected(selectedRole);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update your role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#1EAEDB]">
            Welcome to Power Parent!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            To personalize your experience, please tell us which role best describes you.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {ROLE_OPTIONS.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === role.id 
                  ? 'ring-2 ring-[#1EAEDB] bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {role.label}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {role.description}
                    </p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="text-[#1EAEDB] mt-1">
                      ✓
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}