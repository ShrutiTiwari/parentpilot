import React from 'react';
import { useChildProfiles } from '../../contexts/ChildProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { PlusCircle, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChildProfileSelectorProps {
  onManageProfiles: () => void;
}

export function ChildProfileSelector({ onManageProfiles }: ChildProfileSelectorProps) {
  const { profiles, selectedProfile, selectProfile } = useChildProfiles();
  const { user } = useAuth();
{/* 
  if (!selectedProfile && profiles.length === 0) {
    return (
      <Button 
        onClick={onManageProfiles}
        className="bg-[#1EAEDB] hover:bg-[#1EAEDB]/80 text-white flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add Child Profile
      </Button>
    );
  }
*/}
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-[#1EAEDB] text-white text-xs">
              {selectedProfile ? getInitials(selectedProfile.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate max-w-[100px]">
            {selectedProfile?.name || "Select Child"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {profiles.map(profile => (
          <DropdownMenuItem 
            key={profile.id}
            onClick={() => selectProfile(profile.id)}
            className={`flex items-center gap-2 ${selectedProfile?.id === profile.id ? 'bg-muted' : ''}`}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-[#1EAEDB] text-white text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <span>{profile.name}</span>
          </DropdownMenuItem>
        ))}
        <Separator className="my-1" />
        <DropdownMenuItem onClick={onManageProfiles}>
          <PlusCircle className="h-4 w-4 mr-2" /> 
          Manage Profiles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
