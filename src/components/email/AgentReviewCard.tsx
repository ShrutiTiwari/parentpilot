import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar, Clock, MapPin, Users, AlertTriangle,
  Mail, FileImage, Pencil, CheckCircle, XCircle,
  ChevronDown, ChevronUp, AlertCircle, Tag
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentExtractedEvent {
  title: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  venue: string | null;
  year_group: string;
  category: string;
  description: string;
  actions: { text: string; deadline: string | null }[];
  confidence_score: number;
}

export interface AgentReviewCardProps {
  // Source
  source: 'email' | 'screenshot';
  sourceLabel: string;        // e.g. "skierti@gmail.com" or "school_letter.jpg"
  sourceSubject?: string;     // email subject or filename

  // Extracted data
  events: AgentExtractedEvent[];
  confidenceScore: number;

  // Intelligence warnings from Elastic
  conflicts?: { title: string; year_group: string }[];
  isDuplicate?: boolean;

  // Callbacks
  onConfirm: (events: AgentExtractedEvent[]) => Promise<void>;
  onDiscard: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85
    ? 'bg-green-100 text-green-800 border-green-200'
    : pct >= 60
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${color}`}>
      {pct}% confident
    </span>
  );
}

const CATEGORY_OPTIONS = [
  { value: 'sports',   label: '🏅 Sports' },
  { value: 'swimming', label: '🏊 Swimming' },
  { value: 'music',    label: '🎵 Music' },
  { value: 'exam',     label: '📝 Exam' },
  { value: 'trip',     label: '🚌 Trip' },
  { value: 'parent',   label: '👨‍👩‍👧 Parents' },
  { value: 'holiday',  label: '🏖️ Holiday' },
  { value: 'report',   label: '📄 Report' },
  { value: 'general',  label: '📌 General' },
];

const YEAR_GROUP_OPTIONS = [
  'All', 'Reception',
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map(o => [o.value, o.label])
);

// ─── Single event form (inline editable) ──────────────────────────────────────

function EventForm({
  event,
  onChange,
  index,
  total,
}: {
  event: AgentExtractedEvent;
  onChange: (field: keyof AgentExtractedEvent, value: any) => void;
  index: number;
  total: number;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  const Field = ({
    icon: Icon,
    field,
    label,
    display,
    inputType = 'text',
  }: {
    icon: any;
    field: keyof AgentExtractedEvent;
    label: string;
    display: string;
    inputType?: string;
  }) => {
    const isEditing = editingField === field;
    return (
      <div
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => !isEditing && setEditingField(field as string)}
      >
        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {isEditing ? (
          <Input
            autoFocus
            type={inputType}
            className="h-7 text-sm py-0 px-2 w-full max-w-xs"
            value={event[field] as string || ''}
            onChange={e => onChange(field, e.target.value)}
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

  const formattedDate = (() => {
    try { return event.date ? format(new Date(event.date), 'EEE d MMM yyyy') : ''; }
    catch { return event.date; }
  })();

  return (
    <div>
      {total > 1 && (
        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
          Event {index + 1} of {total}
        </p>
      )}

      {/* Title */}
      <div
        className="group flex items-start gap-2 mb-4 cursor-pointer"
        onClick={() => editingField !== 'title' && setEditingField('title')}
      >
        {editingField === 'title' ? (
          <Input
            autoFocus
            className="text-lg font-bold h-9 px-2"
            value={event.title}
            onChange={e => onChange('title', e.target.value)}
            onBlur={() => setEditingField(null)}
            onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
          />
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 flex-1 leading-tight">{event.title}</h3>
            <Pencil className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0" />
          </>
        )}
      </div>

      {/* Core fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        <Field icon={Calendar} field="date" label="Date" display={formattedDate} inputType="date" />
        <Field
          icon={Clock} field="time_start" label="Time"
          display={event.time_start
            ? `${event.time_start}${event.time_end ? ` – ${event.time_end}` : ''}`
            : ''}
        />
        <Field icon={MapPin} field="venue" label="Venue" display={event.venue || ''} />

        {/* Year group — select */}
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            className="text-sm text-gray-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-blue-400 focus:outline-none cursor-pointer py-0.5 pr-6 flex-1"
            value={event.year_group}
            onChange={e => onChange('year_group', e.target.value)}
          >
            {YEAR_GROUP_OPTIONS.map(yg => (
              <option key={yg} value={yg}>{yg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category — dropdown pill */}
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <select
          className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-medium focus:outline-none focus:border-blue-400 cursor-pointer"
          value={event.category}
          onChange={e => onChange('category', e.target.value)}
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Description (collapsible) */}
      {event.description && (
        <button
          className="text-xs text-gray-400 flex items-center gap-1 mb-2 hover:text-gray-600"
          onClick={() => setDescExpanded(!descExpanded)}
        >
          {descExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {descExpanded ? 'Hide details' : 'Show details'}
        </button>
      )}
      {descExpanded && event.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          {event.description}
        </p>
      )}

      {/* Actions */}
      {event.actions?.length > 0 && (
        <div className="mt-3">
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-gray-700"
            onClick={() => setActionsExpanded(!actionsExpanded)}
          >
            {actionsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Actions needed ({event.actions.length})
          </button>
          {actionsExpanded && (
            <ul className="space-y-1.5">
              {event.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.text}</p>
                    {a.deadline && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        by {(() => { try { return format(new Date(a.deadline), 'd MMM'); } catch { return a.deadline; } })()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function AgentReviewCard({
  source,
  sourceLabel,
  sourceSubject,
  events: initialEvents,
  confidenceScore,
  conflicts = [],
  isDuplicate = false,
  onConfirm,
  onDiscard,
}: AgentReviewCardProps) {
  const [events, setEvents] = useState<AgentExtractedEvent[]>(initialEvents);
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const handleFieldChange = (eventIdx: number, field: keyof AgentExtractedEvent, value: any) => {
    setEvents(prev => prev.map((ev, i) => i === eventIdx ? { ...ev, [field]: value } : ev));
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try { await onConfirm(events); } finally { setConfirming(false); }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try { await onDiscard(); } finally { setDiscarding(false); }
  };

  const SourceIcon = source === 'email' ? Mail : FileImage;

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">

      {/* Source strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <SourceIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate flex-1">
          {source === 'email' ? 'Forwarded email' : 'Screenshot'} · {sourceLabel}
          {sourceSubject && <span className="ml-1 text-gray-400">· {sourceSubject}</span>}
        </span>
        <ConfidenceBadge score={confidenceScore} />
      </div>

      {/* Events */}
      <div className="px-4 py-4 space-y-6 divide-y divide-gray-100">
        {events.map((event, idx) => (
          <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
            <EventForm
              event={event}
              onChange={(field, value) => handleFieldChange(idx, field, value)}
              index={idx}
              total={events.length}
            />
          </div>
        ))}
      </div>

      {/* Intelligence warning */}
      {conflicts.length > 0 && (
        <div className={`mx-4 mb-3 p-3 rounded-xl border ${
          isDuplicate
            ? 'bg-orange-50 border-orange-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${isDuplicate ? 'text-orange-500' : 'text-amber-500'}`} />
            <span className={`text-sm font-semibold ${isDuplicate ? 'text-orange-800' : 'text-amber-800'}`}>
              {isDuplicate ? 'Already in your calendar' : 'Clash detected'}
            </span>
          </div>
          {conflicts.map((c, i) => (
            <p key={i} className={`text-xs ml-6 ${isDuplicate ? 'text-orange-700' : 'text-amber-700'}`}>
              {c.title} · {c.year_group}
            </p>
          ))}
        </div>
      )}

      {/* CTA row */}
      <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          size="sm"
          onClick={handleConfirm}
          disabled={confirming || discarding}
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          {confirming ? 'Adding…' : `Add to calendar${events.length > 1 ? ` (${events.length})` : ''}`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDiscard}
          disabled={confirming || discarding}
          className="text-gray-500 rounded-xl"
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          {discarding ? 'Discarding…' : 'Discard'}
        </Button>
      </div>
    </div>
  );
}
