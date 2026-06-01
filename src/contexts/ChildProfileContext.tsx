import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChildProfile } from '../types/childProfile';
import { childProfileService } from '@/services/childProfileService';
import { useAuth } from './AuthContext';

interface ChildProfileContextProps {
  children: React.ReactNode;
}

interface ChildProfileContextValue {
  profiles: ChildProfile[];
  selectedProfile: ChildProfile | null;
  addProfile: (profile: Omit<ChildProfile, 'id'>) => Promise<{ deferred: boolean; profile?: any }>;
  updateProfile: (profile: ChildProfile) => void;
  deleteProfile: (id: string) => void;
  selectProfile: (id: string) => void;
  pendingProfileOperation: any | null;
  setPendingProfileOperation: (operation: any | null) => void;
  pendingProfileFormData: any | null;
  setPendingProfileFormData: (data: any | null) => void;
  clearPendingFormData: () => void;
}

const ChildProfileContext = createContext<ChildProfileContextValue | undefined>(undefined);

export const ChildProfileProvider = ({ children }: ChildProfileContextProps) => {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [pendingProfileOperation, setPendingProfileOperation] = useState<any | null>(null);
  const [pendingProfileFormData, setPendingProfileFormData] = useState<any | null>(null);
  const { user } = useAuth();

  // Load profiles from Supabase on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const children = await childProfileService.getChildren();
        const profiles = children.map(child => ({
          id: child.id,
          name: child.name,
          yearGroup: child.year_group || '',
          schoolName: child.schools?.name || '',
          schoolId: child.school_id || undefined,
          schoolTermDatesUrl: child.schools?.term_dates_url || '',
        }));
        setProfiles(profiles);
        
        // Select the first profile if available
        if (profiles.length === 0) {
          setSelectedProfileId(profiles[0]?.id || null);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    };

    if (user) {
      loadProfiles();
    }
  }, [user]);

  // Load pending form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('pendingProfileFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setPendingProfileFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        localStorage.removeItem('pendingProfileFormData');
      }
    }
  }, []);

  // Save pending form data to localStorage whenever it changes
  useEffect(() => {
    if (pendingProfileFormData) {
      localStorage.setItem('pendingProfileFormData', JSON.stringify(pendingProfileFormData));
    } else {
      localStorage.removeItem('pendingProfileFormData');
    }
  }, [pendingProfileFormData]);

  const clearPendingFormData = () => {
    setPendingProfileFormData(null);
    localStorage.removeItem('pendingProfileFormData');
  };

  // Persist local profiles to database after authentication
  useEffect(() => {
    if (user && pendingProfileFormData) {
      const persistLocalProfile = async () => {
        try {
          const { editingProfile, selectedCountry, selectedCity, schools } = pendingProfileFormData;
          
          // Find the selected school
          const selectedSchool = schools.find((s: any) => s.name === editingProfile.schoolName);
          if (!selectedSchool) {
            console.error('Selected school not found');
            return;
          }

          // Create the profile in the database
          const newProfile = await childProfileService.createChildProfile({
            name: editingProfile.name,
            schoolId: selectedSchool.id,
            yearGroup: editingProfile.yearGroup,
          });

          // Fetch the complete profile with school data
          const completeProfile = await childProfileService.getChild(newProfile.id);
          if (!completeProfile) {
            throw new Error('Failed to fetch created profile');
          }

          const profile = {
            id: completeProfile.id,
            name: completeProfile.name,
            yearGroup: completeProfile.year_group || '',
            schoolName: completeProfile.schools?.name || '',
            schoolId: completeProfile.school_id || undefined,
            schoolTermDatesUrl: completeProfile.schools?.term_dates_url || '',
          };

          // Add to profiles list
          setProfiles(prev => [...prev, profile]);

          // If this is the first profile, select it automatically
          if (profiles.length === 0) {
            setSelectedProfileId(profile.id);
          }

          // Clear pending data
          clearPendingFormData();
        } catch (error) {
          console.error('Error persisting local profile:', error);
        }
      };

      persistLocalProfile();
    }
  }, [user, pendingProfileFormData]);

  const addProfile = async (profileData: Omit<ChildProfile, 'id'>) => {
    // If not authenticated, save locally
    if (!user) {
      return { deferred: true };
    }

    try {
      const newProfile = await childProfileService.createChildProfile({
        name: profileData.name,
        schoolId: profileData.schoolId,
        yearGroup: profileData.yearGroup,
      });
      
      // Fetch the complete profile with school data
      const completeProfile = await childProfileService.getChild(newProfile.id);
      if (!completeProfile) {
        throw new Error('Failed to fetch created profile');
      }
      
      const profile = {
        id: completeProfile.id,
        name: completeProfile.name,
        yearGroup: completeProfile.year_group || '',
        schoolName: completeProfile.schools?.name || '',
        schoolId: completeProfile.school_id || undefined,
        schoolTermDatesUrl: completeProfile.schools?.term_dates_url || '',
      };
      
      setProfiles(prev => [...prev, profile]);
      
      // If this is the first profile, select it automatically
      if (profiles.length === 0) {
        setSelectedProfileId(profile.id);
      }
      
      return { deferred: false, profile };
    } catch (error) {
      console.error('Error adding profile:', error);
      throw error;
    }
  };

  const updateProfile = async (updatedProfile: ChildProfile) => {
    // If not authenticated, defer the operation
    if (!user) {
      setPendingProfileOperation({ type: 'update', data: updatedProfile });
      return;
    }

    try {
      await childProfileService.updateChildProfile(updatedProfile.id, {
        name: updatedProfile.name,
        schoolId: updatedProfile.schoolId,
        yearGroup: updatedProfile.yearGroup,
      });
      
      // Fetch the complete profile with school data
      const completeProfile = await childProfileService.getChild(updatedProfile.id);
      if (!completeProfile) {
        throw new Error('Failed to fetch updated profile');
      }
      
      const profile = {
        id: completeProfile.id,
        name: completeProfile.name,
        yearGroup: completeProfile.year_group || '',
        schoolName: completeProfile.schools?.name || '',
        schoolId: completeProfile.school_id || undefined,
        schoolTermDatesUrl: completeProfile.schools?.term_dates_url || '',
      };
      
      setProfiles(prev => 
        prev.map(p => p.id === profile.id ? profile : p)
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    // If not authenticated, defer the operation
    if (!user) {
      setPendingProfileOperation({ type: 'delete', data: { id } });
      return;
    }

    try {
      await childProfileService.deleteChildProfile(id);
      setProfiles(prev => prev.filter(profile => profile.id !== id));
      
      // If the deleted profile was selected, select another one
      if (selectedProfileId === id) {
        if (profiles.length > 1) {
          const remainingProfiles = profiles.filter(profile => profile.id !== id);
          setSelectedProfileId(remainingProfiles[0]?.id || null);
        } else {
          setSelectedProfileId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const selectProfile = (id: string) => {
    setSelectedProfileId(id);
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;

  const value: ChildProfileContextValue = {
    profiles,
    selectedProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    pendingProfileOperation,
    setPendingProfileOperation,
    pendingProfileFormData,
    setPendingProfileFormData,
    clearPendingFormData
  };

  return (
    <ChildProfileContext.Provider value={value}>
      {children}
    </ChildProfileContext.Provider>
  );
};

export const useChildProfiles = () => {
  const context = useContext(ChildProfileContext);
  if (context === undefined) {
    throw new Error('useChildProfiles must be used within a ChildProfileProvider');
  }
  return context;
};
