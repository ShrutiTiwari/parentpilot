import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/utils/auth";
import { useToast } from "@/components/ui/use-toast";
import { EventsContent } from "./events/EventsContent";
import {
  LogIn,
  UserCheck,
} from "lucide-react";

export function PowerParentIntegratedLanding() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect after login if a return path was stored
  useEffect(() => {
    if (user) {
      const storedReturnTo = localStorage.getItem('authReturnTo');
      if (storedReturnTo && storedReturnTo !== 'null') {
        localStorage.removeItem('authReturnTo');
        setTimeout(() => {
          navigate(storedReturnTo);
        }, 100);
      } else {
        if (storedReturnTo === 'null') {
          localStorage.removeItem('authReturnTo');
        }
      }
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    } else {
      toast({ title: "Signed out successfully" });
      navigate('/');
    }
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    return user?.email || 'User';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Welcome bar for signed-in users */}
      {user && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Welcome back, {getDisplayName()}! 👋
                </h2>
              </div>
              <Button
                onClick={handleSignOut}
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                <LogIn className="w-4 h-4 mr-2 rotate-180" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In button for unauthenticated users */}
      {!user && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-end">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 border-purple-500/30"
            >
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="container mx-auto px-4 pt-8 pb-6 text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Power Parent</h1>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mb-6"></div>
        <p className="text-xl md:text-2xl text-gray-300 font-semibold mb-2 max-w-3xl mx-auto">
          Parenting is heavy. We take the mental load of family schedules off your plate.
        </p>
        <p className="text-lg text-gray-400 mb-8">
          AI-powered school event extraction, family calendar, and task tracking — all in one place.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg shadow-lg"
        >
          <Link to="/auth">
            Get Started Free
          </Link>
        </Button>
      </div>

      {/* Family & Scheduling content */}
      <section className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <EventsContent theme="light" showHero={false} />
        </div>
      </section>
    </div>
  );
}
