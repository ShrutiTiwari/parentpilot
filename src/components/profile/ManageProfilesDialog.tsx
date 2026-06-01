import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChildProfiles } from '../../contexts/ChildProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, UserPlus, Plus, School, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { childProfileService } from '@/services/childProfileService';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';
import { getYearGroupValues } from '../../utils/yearGroupUtils';
type School = Database['public']['Tables']['schools']['Row'];

interface ManageProfilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAuthModal?: boolean;
  setShowAuthModal?: (show: boolean, action?: string) => void;
}

export function ManageProfilesDialog({ open, onOpenChange, showAuthModal, setShowAuthModal }: ManageProfilesDialogProps) {
  const { profiles, addProfile, updateProfile, deleteProfile, setPendingProfileFormData, pendingProfileFormData } = useChildProfiles();
  const { user } = useAuth();
  const [editingProfile, setEditingProfile] = useState<null | {
    id?: string;
    name: string;
    yearGroup: string;
    schoolName: string;
  }>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newSchoolCountry, setNewSchoolCountry] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (open) {
      loadSchools();
    }
  }, [open]);

  useEffect(() => {
    if (editingProfile && !initializedRef.current) {
      // Only reset location filters if adding a new profile (no id)
      if (!editingProfile.id) {
        setSelectedCountry('');
        setSelectedCity('');
      } else {
        // If editing, try to pre-select country/city for the school
        const school = schools.find(s => s.name === editingProfile.schoolName);
        setSelectedCountry(school?.country || '');
        setSelectedCity(school?.city || '');
      }
      setCities([]);
      setCountries([]);
      loadCountries();
      initializedRef.current = true;
    }
    // Reset initializedRef when dialog closes
    if (!editingProfile) {
      initializedRef.current = false;
    }
  }, [editingProfile]);

  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry || selectedCity) {
      loadSchoolsByLocation();
    }
  }, [selectedCountry, selectedCity]);

  // Prefill school form fields when showAddSchool becomes true
  useEffect(() => {
    if (showAddSchool) {
      setNewSchoolCountry(selectedCountry);
      setNewSchoolCity(selectedCity);
    }
  }, [showAddSchool, selectedCountry, selectedCity]);

  const handleSaveProfile = useCallback(async () => {
    if (!editingProfile) return;

    try {
      // Find the selected school
      const selectedSchool = schools.find(s => s.name === editingProfile.schoolName);
      if (!selectedSchool) {
        toast.error('Please select a valid school');
        return;
      }

      if (editingProfile.id) {
        // Update existing profile
        const updatedProfile = await childProfileService.updateChildProfile(editingProfile.id, {
          name: editingProfile.name,
          schoolId: selectedSchool.id,
          yearGroup: editingProfile.yearGroup,
        });
        updateProfile({
          id: updatedProfile.id,
          name: updatedProfile.name,
          yearGroup: updatedProfile.year_group || '',
          schoolName: selectedSchool.name,
          schoolId: selectedSchool.id,
        });
        
        toast.success('Profile updated successfully');
        setEditingProfile(null);
      } else {
        // Add new profile
        const result = await addProfile({
          name: editingProfile.name,
          schoolId: selectedSchool.id,
          yearGroup: editingProfile.yearGroup,
          schoolName: selectedSchool.name,
        });
        
        if (result.deferred) {
          // User not authenticated - save form data locally
          setPendingProfileFormData({
            editingProfile,
            selectedCountry,
            selectedCity,
            showAddSchool,
            newSchoolName,
            newSchoolCity,
            newSchoolCountry,
            newSchoolAddress,
            countries,
            cities,
            schools
          });
          
          // Trigger auth modal
          if (setShowAuthModal) {
            setShowAuthModal(true, 'create_profile');
          }
          
          toast.success('Profile saved locally! Please sign in to sync with your account.');
          setEditingProfile(null);
        } else {
          // Profile was created successfully
          toast.success('Profile created successfully');
          setEditingProfile(null);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  }, [editingProfile, schools, selectedCountry, selectedCity, showAddSchool, newSchoolName, newSchoolCity, newSchoolCountry, newSchoolAddress, countries, cities, updateProfile, addProfile, setShowAuthModal]);

  // Restore form data after authentication
  useEffect(() => {
    if (user && pendingProfileFormData && !editingProfile) {
      setEditingProfile(pendingProfileFormData.editingProfile);
      setSelectedCountry(pendingProfileFormData.selectedCountry);
      setSelectedCity(pendingProfileFormData.selectedCity);
      setShowAddSchool(pendingProfileFormData.showAddSchool);
      setNewSchoolName(pendingProfileFormData.newSchoolName);
      setNewSchoolCity(pendingProfileFormData.newSchoolCity);
      setNewSchoolCountry(pendingProfileFormData.newSchoolCountry);
      setNewSchoolAddress(pendingProfileFormData.newSchoolAddress);
      setCountries(pendingProfileFormData.countries);
      setCities(pendingProfileFormData.cities);
      setSchools(pendingProfileFormData.schools);
      setPendingProfileFormData(null);
    }
  }, [user, pendingProfileFormData, editingProfile]);

  const loadSchools = async () => {
    try {
      const schoolsData = await childProfileService.getSchools();
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading schools:', error);
      toast.error('Failed to load schools');
    }
  };

  const loadCountries = async () => {
    try {
      const countriesData = await childProfileService.getCountries();
      setCountries(countriesData);
    } catch (error) {
      toast.error('Failed to load countries');
    }
  };

  const loadCities = async (country: string) => {
    try {
      const citiesData = await childProfileService.getCities(country);
      setCities(citiesData);
    } catch (error) {
      toast.error('Failed to load cities');
    }
  };

  const loadSchoolsByLocation = async () => {
    try {
      const schoolsData = await childProfileService.getSchoolsByLocation(selectedCountry, selectedCity);
      setSchools(schoolsData);
    } catch (error) {
      toast.error('Failed to load schools');
    }
  };

  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) {
      toast.error('Please enter a school name');
      return;
    }

    try {
      const newSchool = await childProfileService.createSchool(
        newSchoolName,
        newSchoolAddress,
        newSchoolCity,
        newSchoolCountry
      );
      setSchools([...schools, newSchool]);
      if (editingProfile) {
        setEditingProfile({ ...editingProfile, schoolName: newSchool.name });
      }
      setShowAddSchool(false);
      setNewSchoolName('');
      setNewSchoolCity('');
      setNewSchoolCountry('');
      setNewSchoolAddress('');
      await loadCountries();
      if (newSchool.country) await loadCities(newSchool.country);
      toast.success('School added successfully');
    } catch (error) {
      console.error('Error adding school:', error);
      toast.error('Failed to add school');
    }
  };

  const handleOpenNewProfile = () => {
    setEditingProfile({
      name: '',
      yearGroup: '',
      schoolName: '',
    });
  };

  const handleEditProfile = (profile: {
    id: string;
    name: string;
    yearGroup: string;
    schoolName: string;
  }) => {
    setEditingProfile({
      id: profile.id,
      name: profile.name,
      yearGroup: profile.yearGroup,
      schoolName: profile.schoolName,
    });
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    // If trying to close and there's pending form data, don't allow closure
    if (!newOpen && pendingProfileFormData && !user) {
      toast.info('Please complete authentication to save your profile data');
      return;
    }
    onOpenChange(newOpen);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (editingProfile) {
    return (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile.id ? 'Edit Profile' : 'Add New Child Profile'}</DialogTitle>
            <DialogDescription>
              {editingProfile.id 
                ? "Update your child's information below" 
                : pendingProfileFormData && !user
                ? "Your profile is saved locally. Sign in to sync with your account."
                : "Enter your child's information to create a new profile"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Child's Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter child's name"
                    value={editingProfile.name}
                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearGroup">Year Group</Label>
                  <Select
                    value={editingProfile.yearGroup}
                    onValueChange={(value) => setEditingProfile({ ...editingProfile, yearGroup: value })}
                  >
                    <SelectTrigger id="yearGroup">
                      <SelectValue placeholder="Select year group" />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearGroupValues('personal').map((yearGroup) => (
                        <SelectItem key={yearGroup} value={yearGroup}>
                          {yearGroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* School Location Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">School Location</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setSelectedCity('');
                      if (editingProfile) setEditingProfile({ ...editingProfile, schoolName: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={selectedCity}
                    onValueChange={(value) => {
                      setSelectedCity(value);
                      if (editingProfile) setEditingProfile({ ...editingProfile, schoolName: '' });
                    }}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* School Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">School Selection</h4>
                {!showAddSchool && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSchool(true)}
                    className="flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <School className="h-4 w-4" />
                    Add New School
                  </Button>
                )}
              </div>
              
              {showAddSchool ? (
                <div className="space-y-4 p-6 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" />
                      <h5 className="font-medium text-primary">Add New School</h5>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddSchool(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="text-sm font-medium">School Name *</Label>
                      <Input
                        id="schoolName"
                        placeholder="Enter school name"
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                        className="border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schoolCity" className="text-sm font-medium">City</Label>
                        <Input
                          id="schoolCity"
                          placeholder="Enter city"
                          value={newSchoolCity}
                          onChange={(e) => setNewSchoolCity(e.target.value)}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schoolCountry" className="text-sm font-medium">Country</Label>
                        <Input
                          id="schoolCountry"
                          placeholder="Enter country"
                          value={newSchoolCountry}
                          onChange={(e) => setNewSchoolCountry(e.target.value)}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolAddress" className="text-sm font-medium">Address (Optional)</Label>
                      <Input
                        id="schoolAddress"
                        placeholder="Enter complete address"
                        value={newSchoolAddress}
                        onChange={(e) => setNewSchoolAddress(e.target.value)}
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-primary/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddSchool(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!newSchoolName.trim()) {
                          toast.error('Please enter a school name');
                          return;
                        }
                        try {
                          const newSchool = await childProfileService.createSchool(
                            newSchoolName,
                            newSchoolAddress,
                            newSchoolCity,
                            newSchoolCountry
                          );
                          setSchools([...schools, newSchool]);
                          setSelectedCountry(newSchool.country || '');
                          setSelectedCity(newSchool.city || '');
                          if (editingProfile) setEditingProfile({ ...editingProfile, schoolName: newSchool.name });
                          setShowAddSchool(false);
                          setNewSchoolName('');
                          setNewSchoolCity('');
                          setNewSchoolCountry('');
                          setNewSchoolAddress('');
                          await loadCountries();
                          if (newSchool.country) await loadCities(newSchool.country);
                          toast.success('School added successfully');
                        } catch (error: any) {
                          toast.error('Failed to add school');
                        }
                      }}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add School
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select School</Label>
                  <Select
                    value={editingProfile?.schoolName || ''}
                    onValueChange={(value) => setEditingProfile(editingProfile ? { ...editingProfile, schoolName: value } : null)}
                    disabled={!selectedCountry}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCountry ? "Select a school" : "Select a country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{school.name}</span>
                            {school.address && (
                              <span className="text-xs text-muted-foreground">{school.address}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              disabled={!editingProfile.name || !editingProfile.yearGroup || !editingProfile.schoolName}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editingProfile.id ? 'Update Profile' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Child Profiles</DialogTitle>
          <DialogDescription>
            Add, edit or delete your children's profiles
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {profiles.length > 0 ? (
            <div className="space-y-2">
              {profiles.map(profile => (
                <div 
                  key={profile.id} 
                  className="flex items-center justify-between p-3 border rounded-md bg-background"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#1EAEDB] text-white">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.yearGroup} · {profile.schoolName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditProfile(profile)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteProfile(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No child profiles yet. Add your first child profile to get started.
            </div>
          )}
        </div>
        
        <DialogFooter className={cn(
          "flex",
          profiles.length === 0 ? "justify-center" : "justify-between sm:justify-between"
        )}>
          {profiles.length > 0 && (
            <p className="text-xs text-muted-foreground py-2">
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
            </p>
          )}
          <Button onClick={handleOpenNewProfile} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Child Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
