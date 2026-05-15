import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailReviewCard } from './EmailReviewCard';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface QueueItem {
  id: string;
  raw_subject: string;
  from_address: string;
  received_at: string;
  confidence_score: number;
  extracted_data: { events: any[] };
  status: string;
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
      // silently fail — this is a non-critical UI panel
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleConfirmed = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const handleDiscarded = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

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
          {items.map(item => (
            <EmailReviewCard
              key={item.id}
              item={item}
              onConfirmed={handleConfirmed}
              onDiscarded={handleDiscarded}
              onViewInCalendar={onViewInCalendar}
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
          <Inbox className="w-4 h-4" />
          No emails pending review
        </div>
      )}

      {/* Forward address hint */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Forward school emails to <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">6ab6321a948b3ee4872cf3ae8393baaf@inbound.postmarkapp.com</span>
      </p>
    </div>
  );
}
