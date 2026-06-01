import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar, Clock, MapPin, Users, Tag,
  Lock, Eye, CheckCircle, XCircle,
  ChevronDown, ChevronUp, AlertCircle, Trash2, Plus, Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '../../utils/dateGrouping';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getEventVisibility, setEventVisibility, getSchoolEventVisibilityOptions } from '../../utils/eventVisibilityUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'sports',      label: '🏅 Sports' },
  { value: 'swimming',    label: '🏊 Swimming' },
  { value: 'music',       label: '🎵 Music' },
  { value: 'drama',       label: '🎭 Drama' },
  { value: 'dance',       label: '💃 Dance' },
  { value: 'exam',        label: '📝 Exam' },
  { value: 'trip',        label: '🚌 Trip' },
  { value: 'club',        label: '🏫 Club' },
  { value: 'academic',    label: '📚 Academic' },
  { value: 'competition', label: '🏆 Competition' },
  { value: 'parents',     label: '👨‍👩‍👧 Parents' },
  { value: 'holiday',     label: '🏖️ Holiday' },
  { value: 'report',      label: '📄 Report' },
  { value: 'general',     label: '📌 General' },
];

const YEAR_GROUP_OPTIONS = [
  'All', 'Reception',
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
];

// ─── Props ────────────────────────────────────────────────────────────────────

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
  // Legacy props — kept for compat but no longer used
  extractedEvents?: any[];
  setExtractedEvents?: React.Dispatch<React.SetStateAction<any[]>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventDialog({
  open,
  onOpenChange,
  editingEvent,
  newEvent,
  setNewEvent,
  savingEvent,
  isAdmin = false,
  onSave,
  onTodoChange,
  onTodoRemove,
  onTodoAdd,
  initialEventType = 'personal',
}: EventDialogProps) {
  const { currentTheme } = useAgeTheme();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [actionsExpanded, setActionsExpanded] = useState(true);

  useEffect(() => {
    if (open && !editingEvent) {
      if (!newEvent.title && !newEvent.date && !newEvent.category) {
        setNewEvent({ ...newEvent, event_type: initialEventType });
      }
    }
  }, [open, editingEvent]);

  const formattedDate = (() => {
    try { return newEvent.date ? format(new Date(newEvent.date + 'T00:00:00'), 'EEE d MMM yyyy') : ''; }
    catch { return newEvent.date; }
  })();

  const Field = ({
    icon: Icon,
    field,
    label,
    display,
    inputType = 'text',
  }: {
    icon: any;
    field: string;
    label: string;
    display: string;
    inputType?: string;
  }) => {
    const isEditing = editingField === field;
    return (
      <div
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => !isEditing && setEditingField(field)}
      >
        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {isEditing ? (
          <Input
            autoFocus
            type={inputType}
            className="h-7 text-sm py-0 px-2 w-full max-w-xs"
            value={(newEvent as any)[field] || ''}
            onChange={e => setNewEvent({ ...newEvent, [field]: e.target.value })}
            onBlur={() => setEditingField(null)}
            onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
          />
        ) : (
          <span className="text-sm text-gray-700 flex-1">
            {display || <span className="text-gray-400 italic">Not specified</span>}
          </span>
        )}
        {!isEditing && (
          <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto p-0"
        style={{ borderRadius: currentTheme.styles.borderRadius }}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
          <DialogTitle className="text-sm font-semibold text-gray-700">
            {editingEvent ? 'Edit event' : 'Add event'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingEvent ? 'Edit the event details.' : 'Fill in the event details.'}
          </DialogDescription>
        </div>

        <div className="px-4 py-4 space-y-4">

          {/* Event type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setNewEvent({ ...newEvent, event_type: 'personal', visibility: 'private' })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                newEvent.event_type === 'personal'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Lock className="w-3 h-3" /> Personal
            </button>
            <button
              onClick={() => setNewEvent({ ...newEvent, event_type: 'school', visibility: isAdmin ? 'public' : 'private' })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                newEvent.event_type === 'school'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Users className="w-3 h-3" /> School
            </button>
          </div>

          {/* School admin visibility picker */}
          {newEvent.event_type === 'school' && isAdmin && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">Who can see this?</span>
              </div>
              <RadioGroup
                value={getEventVisibility(newEvent as any)}
                onValueChange={(value) => setNewEvent(setEventVisibility({ ...newEvent }, value as any))}
                className="space-y-1.5"
              >
                {getSchoolEventVisibilityOptions(isAdmin).map(option => (
                  <div key={option.value} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer">
                    <RadioGroupItem value={option.value} id={`vis-${option.value}`} />
                    <label htmlFor={`vis-${option.value}`} className="text-xs text-gray-700 cursor-pointer flex items-center gap-1.5">
                      <span>{option.emoji}</span> {option.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Title */}
          <div
            className="group flex items-start gap-2 cursor-pointer"
            onClick={() => editingField !== 'title' && setEditingField('title')}
          >
            {editingField === 'title' ? (
              <Input
                autoFocus
                className="text-lg font-bold h-9 px-2"
                placeholder="Event title"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                onBlur={() => setEditingField(null)}
                onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
              />
            ) : (
              <>
                <h3 className={`text-lg font-bold flex-1 leading-tight ${newEvent.title ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                  {newEvent.title || 'Event title'}
                </h3>
                <Pencil className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0" />
              </>
            )}
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field icon={Calendar} field="date" label="Date" display={formattedDate} inputType="date" />
            <Field
              icon={Clock} field="time_start" label="Time"
              display={newEvent.time_start
                ? `${newEvent.time_start}${newEvent.time_end ? ` – ${newEvent.time_end}` : ''}`
                : ''}
            />
            <Field icon={MapPin} field="venue" label="Venue" display={newEvent.venue || ''} />

            {/* Year group */}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <select
                className="text-sm text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-gray-400 focus:outline-none cursor-pointer py-0.5 pr-6 flex-1"
                value={newEvent.yearGroup || 'All'}
                onChange={e => setNewEvent({ ...newEvent, yearGroup: e.target.value })}
              >
                {YEAR_GROUP_OPTIONS.map(yg => (
                  <option key={yg} value={yg}>{yg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              className="text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
              value={newEvent.category || 'general'}
              onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Actions / todos */}
          <div>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-gray-700"
              onClick={() => setActionsExpanded(!actionsExpanded)}
            >
              {actionsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Actions needed ({newEvent.todos?.length || 0})
            </button>

            {actionsExpanded && (
              <div className="space-y-2">
                {(newEvent.todos || []).map((todo: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <Input
                      className="h-7 text-sm bg-white border-amber-200 focus:border-amber-400 px-2 flex-1"
                      value={todo.text}
                      placeholder="Action description"
                      onChange={e => onTodoChange(i, e.target.value)}
                    />
                    <button
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      onClick={() => onTodoRemove(i)}
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-1"
                  onClick={onTodoAdd}
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" /> Add action
                </button>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              size="sm"
              onClick={() => onSave()}
              disabled={savingEvent}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {savingEvent ? 'Saving…' : editingEvent ? 'Save changes' : 'Add to calendar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={savingEvent}
              className="text-gray-500 rounded-xl"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
