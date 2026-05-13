import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Lock, Users, Eye, Calendar } from 'lucide-react';
import { ThemedButton } from './ThemedButton';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '../../utils/dateGrouping';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getEventVisibility, setEventVisibility, getSchoolEventVisibilityOptions, getDefaultVisibility, getVisibilityConfig } from '../../utils/eventVisibilityUtils';
import { getCategoryOptions } from '../../utils/categoryUtils';
import { YearGroupMultiSelect } from '@/components/ui/YearGroupMultiSelect';
import { AddEventTabs } from './AddEventTabs';
import { PdfUploadButton } from './PdfUploadButton';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: Event | null;
  showAiWarning: boolean;
  newEvent: {
    title: string;
    date: string;
    category: string;
    yearGroup: string;
    event_type: string;
    visibility: 'public' | 'private' | 'verified_shared';
    time_start: string;
    time_end: string;
    venue: string;
    todos: any[];
    created_by_user_id: string | null;
    school_id: string | null;
  };
  setNewEvent: (event: any) => void;
  yearGroups?: string[];
  selectedProfile: any;
  savingEvent: boolean;
  isAdmin?: boolean;
  onSave: (eventData?: any) => void;
  onTodoChange: (idx: number, value: string) => void;
  onTodoRemove: (idx: number) => void;
  onTodoAdd: () => void;
  initialEventType?: 'personal' | 'school';
  extractedEvents?: any[];
  setExtractedEvents?: React.Dispatch<React.SetStateAction<any[]>>;
}

export function EventDialog({
  open,
  onOpenChange,
  editingEvent,
  showAiWarning,
  newEvent,
  setNewEvent,
  yearGroups = [],
  selectedProfile,
  savingEvent,
  isAdmin = false,
  onSave,
  onTodoChange,
  onTodoRemove,
  onTodoAdd,
  initialEventType = 'personal',
  extractedEvents = [],
  setExtractedEvents,
}: EventDialogProps) {
  const { currentTheme } = useAgeTheme();
  const { user } = useAuth();

  // Set default event type to initialEventType when dialog opens for new events
  useEffect(() => {
    if (open && !editingEvent) {
      // Only update event_type if newEvent is empty
      if (!newEvent.title && !newEvent.date && !newEvent.category) {
        setNewEvent({ ...newEvent, event_type: initialEventType });
      }
    }
  }, [open, editingEvent, setNewEvent, initialEventType]);

  // Add debugging for admin status
  console.log('EventDialog - Current newEvent:', newEvent);
  console.log('EventDialog - isAdmin prop:', isAdmin);

  // Add debugging to see if all array events are received just before displaying
  console.log('EventDialog: extractedEvents before rendering forms:', extractedEvents);
  console.log('EventDialog: newEvent before rendering forms:', newEvent);
  console.log('EventDialog: extractedEvents.length:', extractedEvents.length);
  console.log('EventDialog: open state:', open);

  // Handler for saving an extracted event - this replaces the current newEvent with the extracted event and saves it
  const handleSaveExtractedEvent = async (eventIdx: number, eventData: any) => {
    if (!setExtractedEvents) return;
    
    console.log('Saving extracted event:', eventData);
    
    // Remove this event from extracted events
    const updatedEvents = extractedEvents.filter((_, idx) => idx !== eventIdx);
    setExtractedEvents(updatedEvents);
    
    // Call the main save handler with the specific event data
    await onSave(eventData);
    
    // If this was the last event, close the dialog
    if (updatedEvents.length === 0) {
      console.log('All extracted events saved, closing dialog');
      onOpenChange(false);
    }
  };

  // Handler for editing an extracted event
  const handleEditExtractedEvent = (eventIdx: number, field: string, value: any) => {
    if (!setExtractedEvents) return;
    setExtractedEvents((prev: any[]) => prev.map((ev, idx) => idx === eventIdx ? { ...ev, [field]: value } : ev));
  };

  // Handler for todos in extracted events
  const handleExtractedTodoChange = (eventIdx: number, todoIdx: number, value: string) => {
    if (!setExtractedEvents) return;
    setExtractedEvents((prev: any[]) => prev.map((ev, idx) => {
      if (idx !== eventIdx) return ev;
      const todos = ev.todos ? [...ev.todos] : [];
      todos[todoIdx].text = value;
      return { ...ev, todos };
    }));
  };
  const handleExtractedTodoRemove = (eventIdx: number, todoIdx: number) => {
    if (!setExtractedEvents) return;
    setExtractedEvents((prev: any[]) => prev.map((ev, idx) => {
      if (idx !== eventIdx) return ev;
      const todos = ev.todos ? [...ev.todos] : [];
      todos.splice(todoIdx, 1);
      return { ...ev, todos };
    }));
  };
  const handleExtractedTodoAdd = (eventIdx: number) => {
    if (!setExtractedEvents) return;
    setExtractedEvents((prev: any[]) => prev.map((ev, idx) => {
      if (idx !== eventIdx) return ev;
      const todos = ev.todos ? [...ev.todos] : [];
      todos.push({ id: Math.random().toString(36).slice(2), text: '', completed: false });
      return { ...ev, todos };
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: currentTheme.styles.borderRadius }}
      >
        <DialogTitle style={{ color: currentTheme.colors.primary }}>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogDescription className="text-sm">
          {editingEvent ? 'Edit the event details below.' : 'Fill in the event details below.'}
        </DialogDescription>
        
        {showAiWarning && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>AI Extraction Notice:</strong> Please double-check all details (especially date, time, and venue) as AI may make mistakes when extracting information from images.
            </AlertDescription>
          </Alert>
        )}

        {/* If extractedEvents exist, show a vertical list of forms */}
        {extractedEvents.length > 0 ? (
          <div className="space-y-8">
            <div className="text-sm text-gray-600 mb-4">
              We found {extractedEvents.length} event{extractedEvents.length > 1 ? 's' : ''} in your screenshot. Please review and save each one:
            </div>
            {extractedEvents.map((event, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-4 font-semibold text-gray-700">Event {idx + 1} of {extractedEvents.length}</div>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Title</label>
                    <input
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      placeholder="Event title"
                      value={event.title}
                      onChange={e => handleEditExtractedEvent(idx, 'title', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Date</label>
                    <input
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      type="date"
                      value={event.date}
                      onChange={e => handleEditExtractedEvent(idx, 'date', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Start Time</label>
                    <input
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      placeholder="Start time"
                      value={event.time_start}
                      onChange={e => handleEditExtractedEvent(idx, 'time_start', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">End Time</label>
                    <input
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      placeholder="End time"
                      value={event.time_end}
                      onChange={e => handleEditExtractedEvent(idx, 'time_end', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Venue</label>
                    <input
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      placeholder="Event venue"
                      value={event.venue}
                      onChange={e => handleEditExtractedEvent(idx, 'venue', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Category</label>
                    <select
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                      value={event.category}
                      onChange={e => handleEditExtractedEvent(idx, 'category', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {getCategoryOptions(event.event_type as 'school' | 'personal').map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Year Group</label>
                    <YearGroupMultiSelect
                      eventType={event.event_type as 'personal' | 'school'}
                      value={event.yearGroup ? event.yearGroup.split(',').map(yg => yg.trim()).filter(Boolean) : []}
                      onChange={(value) => handleEditExtractedEvent(idx, 'yearGroup', value.join(','))}
                      placeholder="Select year groups..."
                    />
                  </div>
                  
                  {/* Todos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">To-Dos</label>
                    <div className="space-y-2">
                      {event.todos && event.todos.length > 0 && event.todos.map((todo: any, tIdx: number) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <input
                            className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                            placeholder="Todo item"
                            value={todo.text}
                            onChange={e => handleExtractedTodoChange(idx, tIdx, e.target.value)}
                          />
                          <button
                            className="text-red-500 hover:text-red-700 text-sm px-2"
                            onClick={() => handleExtractedTodoRemove(idx, tIdx)}
                            type="button"
                          >Remove</button>
                        </div>
                      ))}
                      <button
                        className="text-[#1EAEDB] hover:text-[#1EAEDB]/80 text-sm"
                        onClick={() => handleExtractedTodoAdd(idx)}
                        type="button"
                      >+ Add To-Do</button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <ThemedButton
                      onClick={() => handleSaveExtractedEvent(idx, event)}
                      disabled={savingEvent}
                      className="w-full"
                    >
                      {savingEvent ? 'Saving...' : 'Save Event'}
                    </ThemedButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Event Type Selection - Always show both options, highlight correct one */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Event Type</label>
              <div className="flex-1">
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="event_type"
                      value="personal"
                      checked={newEvent.event_type === 'personal'}
                      onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                      className="h-4 w-4 text-[#1EAEDB] focus:ring-[#1EAEDB]"
                    />
                    <Lock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Personal</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="event_type"
                      value="school"
                      checked={newEvent.event_type === 'school'}
                      onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                      className="h-4 w-4 text-[#1EAEDB] focus:ring-[#1EAEDB]"
                    />
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">School</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Section based on Event Type */}
            {newEvent.event_type === 'personal' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">This event is private to you.</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Only you can view or edit it.</p>
              </div>
            ) : (
              isAdmin ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-blue-900">Who can see this event?</label>
                  </div>
                  <RadioGroup
                    value={getEventVisibility(newEvent as any)}
                    onValueChange={(value) => {
                      setNewEvent(setEventVisibility({ ...newEvent }, value as 'public' | 'private' | 'verified_shared'));
                    }}
                    className="space-y-3"
                  >
                    {getSchoolEventVisibilityOptions(isAdmin).map(option => {
                      return (
                        <div key={option.value} className="flex items-start space-x-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-25 cursor-pointer">
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <label htmlFor={option.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{option.emoji}</span>
                              <span className="text-sm font-medium text-gray-900">{option.label}</span>
                              {option.value === 'public' && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Default</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {option.description}
                            </p>
                          </label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">This event is private to you.</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Only you can view or edit it.</p>
                </div>
              )
            )}

            {/* Rest of the form fields */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Venue</label>
              <input
                type="text"
                value={newEvent.venue || ''}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                placeholder="Enter venue location"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => {
                  console.log('Date input changed:', e.target.value);
                  setNewEvent({ ...newEvent, date: e.target.value });
                }}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Category</label>
              <select
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
              >
                <option value="">Select Category</option>
                {getCategoryOptions(newEvent.event_type as 'school' | 'personal').map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Year Group</label>
              <YearGroupMultiSelect
                eventType={newEvent.event_type as 'personal' | 'school'}
                value={newEvent.yearGroup ? newEvent.yearGroup.split(',').map(yg => yg.trim()).filter(Boolean) : []}
                onChange={(value) => setNewEvent({ ...newEvent, yearGroup: value.join(',') })}
                placeholder="Select year groups..."
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">Start Time</label>
              <input
                type="time"
                value={newEvent.time_start}
                onChange={(e) => setNewEvent({ ...newEvent, time_start: e.target.value })}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-500">End Time</label>
              <input
                type="time"
                value={newEvent.time_end}
                onChange={(e) => setNewEvent({ ...newEvent, time_end: e.target.value })}
                className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">To-Dos</label>
              <div className="space-y-2">
                {newEvent.todos.map((todo: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={todo.text}
                      onChange={(e) => onTodoChange(idx, e.target.value)}
                      className="flex-1 block rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-[#1EAEDB] focus:ring-[#1EAEDB] text-sm px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => onTodoRemove(idx)}
                      className="text-red-500 hover:text-red-700 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onTodoAdd}
                  className="text-[#1EAEDB] hover:text-[#1EAEDB]/80 text-sm"
                >
                  + Add To-Do
                </button>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <ThemedButton variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </ThemedButton>
              <ThemedButton onClick={() => onSave()} disabled={savingEvent}>
                {savingEvent ? 'Saving...' : 'Save Event'}
              </ThemedButton>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
