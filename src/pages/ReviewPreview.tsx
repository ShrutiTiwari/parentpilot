/**
 * Preview page for the new AgentReviewCard — accessible at /review-preview
 * Shows both email and screenshot variants side by side (desktop) or stacked (mobile)
 * Delete this file once the new card is rolled out to production flows.
 */
import React, { useState } from 'react';
import { AgentReviewCard } from '@/components/email/AgentReviewCard';
import { toast } from '@/hooks/use-toast';

const EMAIL_EVENT = {
  title: 'RSL Graded Music Exam - Vocals Grade 1',
  date: '2026-07-01',
  time_start: null,
  time_end: null,
  venue: 'DeRosa Music Academy',
  year_group: 'All',
  category: 'exam',
  description: 'Provisional exam date for Pihu Tiwari Mohanty. Exam appointment slip with confirmed location, date and time will be provided no later than 2 weeks before the exam.',
  actions: [
    { text: 'Confirm availability for provisional exam date', deadline: '2026-06-01' },
    { text: 'Await confirmation exam appointment slip with final details', deadline: '2026-06-17' },
  ],
  confidence_score: 0.95,
};

const SCREENSHOT_EVENTS = [
  {
    title: 'World Book Day',
    date: '2026-03-06',
    time_start: '09:00',
    time_end: null,
    venue: 'School hall',
    year_group: 'All',
    category: 'general',
    description: 'Children are invited to dress as their favourite book character.',
    actions: [
      { text: 'Choose a book character', deadline: '2026-02-27' },
      { text: 'Prepare or buy costume', deadline: '2026-03-04' },
    ],
    confidence_score: 0.94,
  },
  {
    title: 'Year 4 Swimming Gala',
    date: '2026-03-12',
    time_start: '14:00',
    time_end: '16:00',
    venue: 'Lewisham Leisure Centre',
    year_group: 'Year 4',
    category: 'swimming',
    description: 'Inter-school swimming competition. Children will be selected by PE staff.',
    actions: [
      { text: 'Return consent form', deadline: '2026-03-07' },
    ],
    confidence_score: 0.88,
  },
];

export default function ReviewPreview() {
  const [emailDismissed, setEmailDismissed] = useState(false);
  const [screenshotDismissed, setScreenshotDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">AgentReviewCard — Preview</h1>
        <p className="text-sm text-gray-500 mb-6">
          New unified review card for email and screenshot flows. Tap any field to edit inline.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Email variant */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Email flow · with duplicate warning
            </p>
            {emailDismissed ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                Card dismissed
                <button className="block mx-auto mt-2 text-blue-500 text-xs underline" onClick={() => setEmailDismissed(false)}>
                  Reset
                </button>
              </div>
            ) : (
              <AgentReviewCard
                source="email"
                sourceLabel="skierti@gmail.com"
                sourceSubject="Fwd: Provisional Exam Date"
                events={[EMAIL_EVENT]}
                confidenceScore={0.95}
                conflicts={[{ title: 'Vocals - Grade 1 Exam (Pihu)', year_group: 'All' }]}
                isDuplicate={true}
                onConfirm={async (events) => {
                  toast({ title: 'Confirmed', description: events[0].title });
                  setEmailDismissed(true);
                }}
                onDiscard={async () => {
                  toast({ title: 'Dismissed' });
                  setEmailDismissed(true);
                }}
                onViewInCalendar={() => toast({ title: 'Navigate to calendar' })}
              />
            )}
          </div>

          {/* Screenshot variant */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Screenshot flow · 2 events · with clash warning
            </p>
            {screenshotDismissed ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                Card dismissed
                <button className="block mx-auto mt-2 text-blue-500 text-xs underline" onClick={() => setScreenshotDismissed(false)}>
                  Reset
                </button>
              </div>
            ) : (
              <AgentReviewCard
                source="screenshot"
                sourceLabel="school_newsletter.jpg"
                events={SCREENSHOT_EVENTS}
                confidenceScore={0.91}
                conflicts={[{ title: 'Year 4 Sports Day', year_group: 'Year 4' }]}
                isDuplicate={false}
                onConfirm={async (events) => {
                  toast({ title: 'Confirmed', description: `${events.length} events added` });
                  setScreenshotDismissed(true);
                }}
                onDiscard={async () => {
                  toast({ title: 'Discarded' });
                  setScreenshotDismissed(true);
                }}
              />
            )}
          </div>

        </div>

        {/* Mobile note */}
        <p className="text-xs text-gray-400 text-center mt-8">
          Resize your browser to mobile width to preview responsive layout
        </p>
      </div>
    </div>
  );
}
