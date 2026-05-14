import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Mail, Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ExtractedAction {
  text: string;
  deadline: string | null;
}

interface ExtractedEvent {
  title: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  venue: string | null;
  year_group: string;
  category: string;
  description: string;
  actions: ExtractedAction[];
  confidence_score: number;
}

interface QueueItem {
  id: string;
  raw_subject: string;
  from_address: string;
  received_at: string;
  confidence_score: number;
  extracted_data: { events: ExtractedEvent[] };
  status: string;
}

interface EmailReviewCardProps {
  item: QueueItem;
  onConfirmed: (id: string) => void;
  onDiscarded: (id: string) => void;
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'bg-green-100 text-green-800' : pct >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{pct}% confident</span>;
}

export function EmailReviewCard({ item, onConfirmed, onDiscarded }: EmailReviewCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const events = item.extracted_data?.events || [];
  const firstEvent = events[0];
  if (!firstEvent) return null;

  const handleConfirm = async () => {
    if (!user) return;
    setConfirming(true);
    try {
      const res = await fetch(API_ENDPOINTS.inboundEmail.confirm(item.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, events }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Event added to calendar', description: firstEvent.title });
      onConfirmed(item.id);
    } catch (e: any) {
      toast({ title: 'Failed to confirm', description: e.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      const res = await fetch(API_ENDPOINTS.inboundEmail.discard(item.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Email discarded' });
      onDiscarded(item.id);
    } catch (e: any) {
      toast({ title: 'Failed to discard', description: e.message, variant: 'destructive' });
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 p-2 bg-blue-50 rounded-lg">
          <Mail className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-gray-500 truncate">{item.from_address}</span>
            <ConfidenceBadge score={item.confidence_score} />
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">{item.raw_subject}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{firstEvent.title}</p>
        </div>
      </div>

      {/* Event details */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{firstEvent.date ? format(new Date(firstEvent.date), 'EEE d MMM yyyy') : '—'}</span>
        </div>
        {firstEvent.time_start && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{firstEvent.time_start}{firstEvent.time_end ? ` – ${firstEvent.time_end}` : ''}</span>
          </div>
        )}
        {firstEvent.venue && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{firstEvent.venue}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{firstEvent.year_group}</span>
        </div>
      </div>

      {/* Description */}
      {firstEvent.description && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{firstEvent.description}</p>
        </div>
      )}

      {/* Actions */}
      {firstEvent.actions && firstEvent.actions.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Actions needed</p>
          <ul className="space-y-1">
            {firstEvent.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  {a.text}
                  {a.deadline && <span className="text-gray-400 ml-1">by {format(new Date(a.deadline), 'd MMM')}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Multiple events toggle */}
      {events.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 border-t border-gray-100"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Show less' : `+${events.length - 1} more event${events.length - 1 > 1 ? 's' : ''} in this email`}
        </button>
      )}

      {expanded && events.slice(1).map((ev, i) => (
        <div key={i} className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="font-medium text-sm text-gray-800">{ev.title}</p>
          <p className="text-xs text-gray-500">{ev.date} · {ev.year_group}</p>
        </div>
      ))}

      {/* CTA row */}
      <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
          onClick={handleConfirm}
          disabled={confirming || discarding}
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          {confirming ? 'Adding…' : 'Add to calendar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDiscard}
          disabled={confirming || discarding}
          className="text-gray-500"
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          {discarding ? 'Discarding…' : 'Discard'}
        </Button>
      </div>
    </div>
  );
}
