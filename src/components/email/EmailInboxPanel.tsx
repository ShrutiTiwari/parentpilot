import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Inbox, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentReviewCard, AgentExtractedEvent } from './AgentReviewCard';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface QueueItem {
  id: string;
  raw_subject: string;
  raw_body?: string | null;
  from_address: string;
  received_at: string;
  confidence_score: number;
  extracted_data: { events: any[] } | null;
  status: string;
  error_message?: string | null;
}

interface EmailInboxPanelProps {
  onViewInCalendar?: (event: any) => void;
}

export function EmailInboxPanel({ onViewInCalendar }: EmailInboxPanelProps = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.inboundEmail.pending}?user_id=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // silently fail — non-critical panel
    } finally {
      setLoading(false);
    }
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const raw = item.extracted_data;
            const events: AgentExtractedEvent[] = Array.isArray(raw?.events)
              ? raw.events.map((e: any) => ({
                  title: e.title || '',
                  date: e.date || '',
                  time_start: e.time_start || null,
                  time_end: e.time_end || null,
                  venue: e.venue || null,
                  year_group: e.year_group || e.yearGroup || 'All',
                  category: e.category || 'general',
                  description: e.description || '',
                  actions: e.actions || [],
                  confidence_score: e.confidence_score ?? item.confidence_score ?? 0.8,
                }))
              : [];

            // Failed extraction — minimal dismiss card
            if (events.length === 0) {
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
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <AgentReviewCard
                key={item.id}
                source="email"
                sourceLabel={item.from_address}
                sourceSubject={item.raw_subject}
                sourceBody={item.raw_body || undefined}
                events={events}
                confidenceScore={item.confidence_score}
                onConfirm={async (eventsToConfirm) => {
                  const res = await fetch(API_ENDPOINTS.inboundEmail.confirm(item.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, events: eventsToConfirm }),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  const data = await res.json();
                  const inserted = data.events?.[0];
                  if (inserted && onViewInCalendar) {
                    toast({
                      title: `${eventsToConfirm.length} event${eventsToConfirm.length > 1 ? 's' : ''} added`,
                      description: eventsToConfirm[0].title,
                    });
                  }
                }}
                onDiscard={async () => {
                  await fetch(API_ENDPOINTS.inboundEmail.discard(item.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  });
                  removeItem(item.id);
                }}
                onViewInCalendar={onViewInCalendar ? () => onViewInCalendar({}) : undefined}
              />
            );
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
