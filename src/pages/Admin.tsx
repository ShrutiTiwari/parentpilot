import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const ADMIN_SECRET = 'powerparent-admin-2026';

function authHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };
}

interface Pattern {
  field_name: string;
  count: number;
  examples: { original: string; corrected: string }[];
}

interface ReviewResult {
  correction_count: number;
  patterns: Pattern[];
  summary: string;
  patterns_found: string[];
  suggested_prompt: string;
  current_prompt: string;
}

interface PromptVersion {
  id: string;
  version: number;
  status: string;
  summary: string;
  correction_count_at_review: number;
  activated_at: string;
}

export default function Admin() {
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => { fetchVersions(); }, []);

  async function fetchVersions() {
    try {
      const res = await fetch(API_ENDPOINTS.prompts.list, { headers: authHeaders() });
      if (res.ok) {
        const { prompts } = await res.json();
        setVersions(prompts || []);
      }
    } catch {}
  }

  async function handleReview() {
    setReviewing(true);
    setError(null);
    setReview(null);
    setApplied(false);
    try {
      const res = await fetch(API_ENDPOINTS.prompts.review, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.suggested_prompt) {
        setError(data.message || 'No corrections to review yet');
      } else {
        setReview(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReviewing(false);
    }
  }

  async function handleApply() {
    if (!review) return;
    setApplying(true);
    try {
      const res = await fetch(API_ENDPOINTS.prompts.apply, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          suggested_prompt: review.suggested_prompt,
          summary: review.summary,
          correction_count: review.correction_count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplied(true);
      setReview(null);
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prompt Improvement Engine</h1>
            <p className="text-sm text-gray-500 mt-1">Analyse parent corrections and improve the extraction prompt</p>
          </div>
          <a href="/" className="text-sm text-blue-600 hover:underline">← Back to app</a>
        </div>

        {/* Trigger review */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Review corrections</h2>
              <p className="text-sm text-gray-500">Gemini will analyse all parent edits and suggest an improved prompt</p>
            </div>
            <button
              onClick={handleReview}
              disabled={reviewing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {reviewing ? 'Analysing…' : 'Review corrections'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {applied && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
              ✓ New prompt applied and live. Next extractions will use the improved prompt.
            </div>
          )}
        </div>

        {/* Review results */}
        {review && (
          <div className="space-y-4">

            {/* Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                Patterns found in {review.correction_count} corrections
              </h3>
              <p className="text-sm text-amber-700 mb-3">{review.summary}</p>
              <ul className="space-y-1">
                {review.patterns_found?.map((p, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Correction breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Correction breakdown</h3>
              <div className="space-y-3">
                {review.patterns.map(p => (
                  <div key={p.field_name} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{p.field_name}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.count} corrections</span>
                    </div>
                    <div className="space-y-1">
                      {p.examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-red-400 font-mono bg-red-50 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            "{ex.original || '(empty)'}"
                          </span>
                          <span className="text-gray-400 mt-0.5">→</span>
                          <span className="text-green-600 font-mono bg-green-50 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            "{ex.corrected}"
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-side prompt diff */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Prompt diff</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current prompt</div>
                  <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">
                    {review.current_prompt}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Suggested prompt</div>
                  <pre className="text-xs text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3 whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">
                    {review.suggested_prompt}
                  </pre>
                </div>
              </div>
            </div>

            {/* Apply / Ignore */}
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {applying ? 'Applying…' : '✓ Apply — make this prompt live'}
              </button>
              <button
                onClick={() => setReview(null)}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50"
              >
                Ignore
              </button>
            </div>
          </div>
        )}

        {/* Version history */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Prompt version history</h2>
          {versions.length === 0 ? (
            <p className="text-sm text-gray-400">No versions yet</p>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <span className="text-sm font-semibold text-gray-700">v{v.version}</span>
                    {v.status === 'active' && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">live</span>
                    )}
                    {v.status === 'archived' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">archived</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{v.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.correction_count_at_review > 0 && `${v.correction_count_at_review} corrections analysed · `}
                      {v.activated_at ? new Date(v.activated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
