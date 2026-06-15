import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Inbox, XCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentReviewCard, AgentExtractedEvent } from './AgentReviewCard';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/contexts/ChildProfileContext';
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
  raw_html?: string | null;
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
  const { selectedProfile } = useChildProfiles();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  // conflicts keyed by staging event id
  const [conflictsMap, setConflictsMap] = useState<Record<string, ConflictResult[]>>({});

  const inboundAddress = user ? `calendar+${user.id}@inbound.powerparent.co.uk` : '';
  const copyAddress = () => {
    navigator.clipboard.writeText(inboundAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Strip HTML tags and return plain text; prefer raw_body if it has real content
  const getBestBody = (item: QueueItem): string | undefined => {
    const body = item.raw_body?.trim();
    // If raw_body has meaningful content (more than ~50 chars), use it
    if (body && body.length > 50) return body;
    // Fall back to HTML stripped of tags
    if (item.raw_html) {
      const stripped = item.raw_html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, '\n')
        .trim();
      if (stripped.length > 50) return stripped;
    }
    return body || undefined;
  };

  if (!user) return null;

  return (
    <div className="mb-6">

      {/* Header — always visible, clickable to collapse */}
      <div
        className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">
            Emails to review
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${items.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {items.length}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {!collapsed && (
            <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); fetchPending(); }} disabled={loading} className="text-gray-400 hover:text-gray-600 h-7 px-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronUp className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <>
          {loading && items.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
              Checking inbox…
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
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
                    event_type: 'school' as const,
                  }));

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
                      sourceBody={idx === 0 ? getBestBody(item) : undefined}
                      events={[ev]}
                      confidenceScore={ev.confidence_score}
                      conflicts={conflicts}
                      isDuplicate={isDuplicate}
                      showEventTypePicker={true}
                      onConfirm={async (eventsToConfirm, corrections) => {
                        const edited = eventsToConfirm[0];
                        const res = await fetch(API_ENDPOINTS.inboundEmail.stagingConfirm(ev._stagingId), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            user_id: user.id,
                            event: {
                              ...edited,
                              school_id: edited.school_id || selectedProfile?.school_id || null,
                            },
                          }),
                        });
                        if (!res.ok) throw new Error(await res.text());
                        const confirmed = await res.json();
                        if (corrections && corrections.length > 0) {
                          fetch(API_ENDPOINTS.extractionCorrections, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              event_id: confirmed.id,
                              queue_id: item.id,
                              user_id: user.id,
                              confidence_score: ev.confidence_score,
                              corrections,
                            }),
                          }).catch(() => {});
                        }
                        toast({ title: 'Added to calendar', description: edited.title });
                        setItems(prev => prev.map(i => {
                          if (i.id !== item.id) return i;
                          const remaining = i.staging_events.filter(s => s.id !== ev._stagingId);
                          return { ...i, staging_events: remaining };
                        }).filter(i => i.staging_events.length > 0));
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
            <div className="text-sm text-gray-400 py-2 text-center">
              <Inbox className="w-4 h-4 mx-auto mb-1" />
              No emails pending review
            </div>
          )}

          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <p className="text-xs text-blue-700 font-medium mb-1.5">Your personal forwarding address</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-white border border-blue-200 px-2 py-1 rounded text-gray-700 flex-1 truncate">
                {inboundAddress}
              </span>
              <button onClick={e => { e.stopPropagation(); copyAddress(); }} className="flex-shrink-0 text-blue-600 hover:text-blue-800">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-blue-500 mt-1.5">Set this as your auto-forward address in Gmail or Outlook</p>
          </div>
        </>
      )}
    </div>
  );
}
