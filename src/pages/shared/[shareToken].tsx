import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicSharingService } from '@/services/publicSharingService';

export default function SharedCalendarPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<any>(null);

  useEffect(() => {
    if (shareToken) {
      fetchSharedData(shareToken);
    }
  }, [shareToken]);

  const fetchSharedData = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await PublicSharingService.getSharedLearnerData(token);
      if (!data) throw new Error('Shared calendar not found or link has expired');
      setSharedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared calendar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shared calendar...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Calendar Not Available</h1>
              <p className="text-gray-600 mb-4">
                {error || 'This shared calendar link is not valid or has expired.'}
              </p>
              <Button onClick={() => (window.location.href = '/')}>
                Go to Parent Pilot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Shared Calendar</h1>
        <pre className="text-xs text-gray-500">{JSON.stringify(sharedData, null, 2)}</pre>
      </div>
    </div>
  );
}
