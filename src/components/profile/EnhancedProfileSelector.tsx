import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, PlusCircle, User, GraduationCap, Music, Calendar } from "lucide-react";
import { LearnerProfile } from "@/types/learnerProfile";

interface EnhancedProfileSelectorProps {
  profiles: LearnerProfile[];
  selectedProfile: LearnerProfile | null;
  onSelectProfile: (profile: LearnerProfile) => void;
  onManageProfiles: () => void;
  currentModule: 'events' | 'music';
}

export function EnhancedProfileSelector({ 
  profiles, 
  selectedProfile, 
  onSelectProfile, 
  onManageProfiles,
  currentModule 
}: EnhancedProfileSelectorProps) {
  
  // Filter profiles based on current module
  const availableProfiles = profiles.filter(profile => {
    if (currentModule === 'events') return profile.eventsEnabled;
    if (currentModule === 'music') return profile.musicEnabled;
    return true;
  });

  const getProfileIcon = (profile: LearnerProfile) => {
    if (profile.isMainUser) return "👨‍🎓";
    if (profile.type === 'adult') return "👩‍🎓";
    if (profile.type === 'child') return "🎹";
    return "👤";
  };

  const getProfileSubtext = (profile: LearnerProfile) => {
    const parts = [];
    if (currentModule === 'events' && profile.yearGroup) {
      parts.push(profile.yearGroup);
    }
    if (currentModule === 'music' && profile.musicGrade) {
      parts.push(`Grade ${profile.musicGrade}`);
    }
    if (profile.schoolName && currentModule === 'events') {
      parts.push(profile.schoolName);
    }
    if (profile.musicInstrument && currentModule === 'music') {
      parts.push(profile.musicInstrument);
    }
    return parts.join(' • ');
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[160px]">
          {selectedProfile ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {getInitials(selectedProfile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{selectedProfile.name}</span>
                {selectedProfile.isMainUser && (
                  <span className="text-xs text-gray-500">Main User</span>
                )}
              </div>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span>Select Profile</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {availableProfiles.length > 0 ? (
          availableProfiles.map(profile => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className="flex items-center gap-3 p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`text-white text-sm ${
                  profile.isMainUser ? 'bg-purple-500' : 
                  profile.type === 'adult' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{profile.name}</span>
                  {profile.isMainUser && <span className="text-xs">👑</span>}
                  {profile.eventsEnabled && <Calendar className="h-3 w-3 text-blue-500" />}
                  {profile.musicEnabled && <Music className="h-3 w-3 text-green-500" />}
                </div>
                <div className="text-xs text-gray-500">
                  {getProfileSubtext(profile)}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-3 text-center text-gray-500">
            <div className="text-sm">No profiles available for {currentModule}</div>
            <div className="text-xs mt-1">
              {currentModule === 'events' ? 
                'Create a profile with school info to use events' :
                'Create a profile with music grade to practice'
              }
            </div>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onManageProfiles} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> 
          Manage Family Profiles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 