
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { signOut } from '@/utils/auth';
import { useToast } from "@/components/ui/use-toast";

export function Header() {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Refresh the page after signout
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-end px-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <div className="container flex justify-center items-center py-2">
        <h1 className="text-2xl font-bold">Power Parent</h1>
      </div>
    </header>
  );
}
