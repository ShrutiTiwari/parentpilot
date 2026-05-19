import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Inbox, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentReviewCard, AgentExtractedEvent } from './AgentReviewCard';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StagingEvent {
  id: string;
  queue_id: string;
  title: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  venue: string | null;
  year_group: string;
  category: string;
  description: string | null;
  actions: { text: string; deadline: string | null }[];
  confidence_score: number;
  status: string;
}

interface QueueItem {
  id: string;
  raw_subject: string;
  raw_body?: string | null;
  from_address: string;
  received_at: string;
  confidence_score: number;
  status: string;
  error_message?: string | null;
  staging_events: StagingEvent[];
}

interface ConflictResult {
  title: string;
  year_group: string;
}

interface EmailInboxPanelProps {
  onViewInCalendar?: (event: any) => void;
}

export function EmailInboxPanel({ onViewInCalendar }: EmailInboxPanelProps = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  // conflicts keyed by staging event id
  const [conflictsMap, setConflictsMap] = useState<Record<string, ConflictResult[]>>({});

  const fetchPending = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.inboundEmail.pending}?user_id=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const fetchedItems: QueueItem[] = data.items || [];
      setItems(fetchedItems);

      // Fetch conflicts for all pending staging events
      const allStagingEvents = fetchedItems.flatMap(i => i.staging_events);
      const conflictChecks = allStagingEvents.map(async (ev) => {
        try {
          const r = await fetch(API_ENDPOINTS.events.checkConflicts, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: ev.date, year_group: ev.year_group }),
          });
          if (!r.ok) return { id: ev.id, conflicts: [] };
          const d = await r.json();
          return { id: ev.id, conflicts: d.conflicts || [] };
        } catch {
          return { id: ev.id, conflicts: [] };
        }
      });

      const results = await Promise.all(conflictChecks);
      const map: Record<string, ConflictResult[]> = {};
      for (const r of results) map[r.id] = r.conflicts;
      setConflictsMap(map);
    } catch {
      // silently fail — non-critical panel
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPending(); }, [user]);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  if (!user) return null;
  if (!loading && items.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">
            Emails to review
            {items.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{items.length}</span>
            )}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPending} disabled={loading} className="text-gray-400 hover:text-gray-600 h-7 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-4">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
          Checking inbox…
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            // No staging events — extraction failed
            if (!item.staging_events.length) {
              const discard = async () => {
                try {
                  await fetch(API_ENDPOINTS.inboundEmail.discard(item.id), { method: 'POST' });
                  removeItem(item.id);
                } catch {
                  toast({ title: 'Failed to discard', variant: 'destructive' });
                }
              };
              return (
                <div key={item.id} className="border border-red-100 rounded-xl bg-white shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.raw_subject || 'Email'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.from_address}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {item.error_message
                          ? `Could not extract event: ${item.error_message}`
                          : 'No events found in this email'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={discard} className="text-gray-500 flex-shrink-0">
                      <XCircle className="w-4 h-4 mr-1.5" />Dismiss
                    </Button>
                  </div>
                </div>
              );
            }

            // Map staging events → AgentExtractedEvent shape, carrying staging id
            const agentEvents: (AgentExtractedEvent & { _stagingId: string })[] =
              item.staging_events.map(ev => ({
                _stagingId: ev.id,
                title: ev.title,
                date: ev.date,
                time_start: ev.time_start,
                time_end: ev.time_end,
                venue: ev.venue,
                year_group: ev.year_group,
                category: ev.category,
                description: ev.description || '',
                actions: ev.actions || [],
                confidence_score: ev.confidence_score ?? item.confidence_score ?? 0.8,
              }));

            // Build per-event conflicts/isDuplicate for AgentReviewCard
            // AgentReviewCard takes top-level conflicts/isDuplicate (applies to all events)
            // Since each event may have different conflicts, we pass the union and let
            // EventForm show the warning for each event individually via the conflicts prop.
            // We achieve per-event by rendering one AgentReviewCard per staging event.
            return agentEvents.map((ev, idx) => {
              const conflicts = conflictsMap[ev._stagingId] || [];
              const incomingWords = new Set(
                ev.title.toLowerCase().split(/\W+/).filter(w => w.length > 3)
              );
              const isDuplicate = conflicts.some(c => {
                const cWords = c.title.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                return cWords.filter(w => incomingWords.has(w)).length >= 2;
              });

              return (
                <AgentReviewCard
                  key={ev._stagingId}
                  source="email"
                  sourceLabel={item.from_address}
                  sourceSubject={idx === 0 ? item.raw_subject : undefined}
                  sourceBody={idx === 0 ? (item.raw_body || undefined) : undefined}
                  events={[ev]}
                  confidenceScore={ev.confidence_score}
                  conflicts={conflicts}
                  isDuplicate={isDuplicate}
                  onConfirm={async (eventsToConfirm) => {
                    const edited = eventsToConfirm[0];
                    const res = await fetch(API_ENDPOINTS.inboundEmail.stagingConfirm(ev._stagingId), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user.id,
                        event: edited,
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    const confirmedEvent = data.event || edited;
                    toast({ title: 'Added to calendar', description: edited.title });
                    // Remove this staging event from the item first, then navigate
                    setItems(prev => prev.map(i => {
                      if (i.id !== item.id) return i;
                      const remaining = i.staging_events.filter(s => s.id !== ev._stagingId);
                      return { ...i, staging_events: remaining };
                    }).filter(i => i.staging_events.length > 0));
                    if (onViewInCalendar) onViewInCalendar(confirmedEvent);
                  }}
                  onDiscard={async () => {
                    await fetch(API_ENDPOINTS.inboundEmail.stagingDiscard(ev._stagingId), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    setItems(prev => prev.map(i => {
                      if (i.id !== item.id) return i;
                      const remaining = i.staging_events.filter(s => s.id !== ev._stagingId);
                      return { ...i, staging_events: remaining };
                    }).filter(i => i.staging_events.length > 0));
                  }}
                  onViewInCalendar={onViewInCalendar && isDuplicate
                    ? () => onViewInCalendar({ ...conflicts[0], date: ev.date })
                    : undefined}
                />
              );
            });
          })}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
          <Inbox className="w-4 h-4" />
          No emails pending review
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Forward school emails to <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">6ab6321a948b3ee4872cf3ae8393baaf@inbound.postmarkapp.com</span>
      </p>
    </div>
  );
}
