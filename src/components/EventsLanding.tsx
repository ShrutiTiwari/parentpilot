import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "lucide-react";
import { EventsContent } from "./events/EventsContent";

export function EventsLanding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-full mx-auto px-4 md:px-2 lg:px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">PowerParent</span>
          </Link>

          {/* Right side buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-300 hidden sm:inline">Welcome, {user.email?.split('@')[0]}</span>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  <Link to="/home">
                    Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <EventsContent />
    </div>
  );
}
