import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeekendPlan } from '@/utils/weekendPlanTypes';
import { formatDate } from '../../utils/dateUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { dataService } from '@/services/weekendPlanService';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

interface AddWeekendPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlan: (plan: WeekendPlan) => void;
  childName: string;
}

export function AddWeekendPlanDialog({ open, onOpenChange, onAddPlan, childName }: AddWeekendPlanDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [venue, setVenue] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('general');
  const [yearGroup, setYearGroup] = useState('');
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !venue || !time) {
      // Basic validation
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error('Auth error:', authError);
      toast({
        title: "Error",
        description: "You must be logged in to add a weekend plan.",
        variant: "destructive",
      });
      return;
    }

    // Format the date
    const formattedDate = date ? formatDate(date.toISOString().split('T')[0], { includeYear: true }) : '';
    
    // Create the new weekend plan
    const newPlan: WeekendPlan = {
      id: crypto.randomUUID(),
      title,
      date: formattedDate,
      venue,
      time,
      category,
      yearGroup: yearGroup || 'Family',
    };
    
    try {
      // Save using dataService
      await dataService.addWeekendPlan(childName, newPlan);
      
      toast({
        title: "Success",
        description: "Weekend plan added successfully!",
      });
      
      // Add the new plan to the UI
      onAddPlan(newPlan);
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving weekend plan:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to save weekend plan",
        variant: "destructive",
      });
      
      // Even if the API call fails, update the UI (optimistic update)
      onAddPlan(newPlan);
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDate(undefined);
    setVenue('');
    setTime('');
    setCategory('general');
    setYearGroup('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Weekend Plan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Charlie's Birthday Party"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {date ? formatDate(date.toISOString().split('T')[0], { includeYear: true }) : <span>Pick a date</span>}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input 
              id="venue" 
              value={venue} 
              onChange={(e) => setVenue(e.target.value)} 
              placeholder="e.g., Flip out, Canary Wharf"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input 
              id="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
              placeholder="e.g., 03:00 - 05:30"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="drama">Drama</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yearGroup">Year Group</Label>
            <Input 
              id="yearGroup" 
              value={yearGroup} 
              onChange={(e) => setYearGroup(e.target.value)} 
              placeholder="e.g., Year 3 or Family"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button type="submit">Add Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
