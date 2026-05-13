import React from 'react';
import { FestivalEventCard } from './FestivalEventCard';
import { Event } from '../../utils/dateGrouping';

// Demo events to showcase festival theming
const demoEvents: Event[] = [
  {
    id: 'christmas-1',
    title: 'Christmas Day',
    date: '2025-12-25',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'christmas-2',
    title: 'Christmas Eve Service',
    date: '2025-12-24',
    time_start: '18:00:00',
    time_end: '19:30:00',
    category: 'religious',
    venue: 'Local Church',
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'easter-1',
    title: 'Easter Egg Hunt',
    date: '2025-04-20',
    time_start: '10:00:00',
    time_end: '12:00:00',
    category: 'family',
    venue: 'Community Park',
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'halloween-1',
    title: 'Halloween Party',
    date: '2025-10-31',
    time_start: '19:00:00',
    time_end: '21:00:00',
    category: 'social',
    venue: 'School Hall',
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'diwali-1',
    title: 'Diwali Celebration',
    date: '2025-11-01',
    time_start: '18:00:00',
    time_end: '20:00:00',
    category: 'cultural',
    venue: 'Community Center',
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'holi-1',
    title: 'Holi Festival of Colors',
    date: '2025-03-14',
    time_start: '10:00:00',
    time_end: '16:00:00',
    category: 'cultural',
    venue: 'Local Park',
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'eid-1',
    title: 'Eid al-Fitr Celebration',
    date: '2025-04-01',
    time_start: '09:00:00',
    time_end: '12:00:00',
    category: 'religious',
    venue: 'Mosque',
    event_type: 'personal',
    visibility: 'private',
    year_group: 'All',
    year_groups: ['All'],
    school_id: null,
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'winter-holidays',
    title: 'Winter Holiday Break',
    date: '2025-12-20',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'summer-holidays',
    title: 'Summer Holiday Break',
    date: '2025-07-22',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'half-term',
    title: 'Half Term Break',
    date: '2025-02-17',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'spring-break',
    title: 'Spring Break',
    date: '2025-04-07',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
  {
    id: 'regular-1',
    title: 'Parent Teacher Meeting',
    date: '2025-01-15',
    time_start: '15:30:00',
    time_end: '16:30:00',
    category: 'meeting',
    venue: 'Classroom 5B',
    event_type: 'school',
    visibility: 'private',
    year_group: 'Year 5',
    year_groups: ['Year 5'],
    school_id: 'demo-school',
    created_by_user_id: 'demo',
    todos: []
  },
];

export function FestivalEventDemo() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Festival Event Cards Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Showcasing automatic festival theming for Christmas, Easter, Halloween, Indian festivals, holiday breaks, and regular events.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoEvents.map((event) => (
            <div key={event.id} className="space-y-2">
              <FestivalEventCard event={event} />
              <p className="text-xs text-gray-500 text-center">
                Theme: {event.title.toLowerCase().includes('christmas') ? 'Christmas 🎄' :
                        event.title.toLowerCase().includes('easter') ? 'Easter 🐰' :
                        event.title.toLowerCase().includes('halloween') ? 'Halloween 🎃' :
                        event.title.toLowerCase().includes('diwali') ? 'Diwali 🪔' :
                        event.title.toLowerCase().includes('holi') ? 'Holi 🎨' :
                        event.title.toLowerCase().includes('eid') ? 'Eid 🌙' :
                        event.title.toLowerCase().includes('summer holiday') || event.title.toLowerCase().includes('summer break') ? 'Summer Holiday ☀️' :
                        event.title.toLowerCase().includes('holiday') || event.title.toLowerCase().includes('half term') || event.title.toLowerCase().includes('break') ? 'Holiday 🏖️' :
                        'Default 📅'}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Theme Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🎄</div>
              <h3 className="font-medium text-red-600">Christmas</h3>
              <p className="text-sm text-gray-600">Red gradient, sparkles, glow effect</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🐰</div>
              <h3 className="font-medium text-purple-600">Easter</h3>
              <p className="text-sm text-gray-600">Purple-pink gradient, flower sparkles</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎃</div>
              <h3 className="font-medium text-orange-600">Halloween</h3>
              <p className="text-sm text-gray-600">Orange-black gradient, spooky effects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🪔</div>
              <h3 className="font-medium text-yellow-600">Diwali</h3>
              <p className="text-sm text-gray-600">Golden gradient, lamp sparkles</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-medium text-pink-600">Holi</h3>
              <p className="text-sm text-gray-600">Rainbow gradient, colorful effects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌙</div>
              <h3 className="font-medium text-emerald-600">Eid</h3>
              <p className="text-sm text-gray-600">Green gradient, star sparkles</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏖️</div>
              <h3 className="font-medium text-blue-600">Holiday</h3>
              <p className="text-sm text-gray-600">Blue gradient, for school breaks</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">☀️</div>
              <h3 className="font-medium text-yellow-600">Summer Holiday</h3>
              <p className="text-sm text-gray-600">Yellow-orange gradient, vacation vibes</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-medium text-gray-600">Regular</h3>
              <p className="text-sm text-gray-600">Clean white/gray styling</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Auto-Detection Rules
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Christmas:</strong> Keywords: "christmas", "xmas", "nativity" OR dates: Dec 24-26</li>
            <li><strong>Easter:</strong> Keywords: "easter", "egg hunt", "bunny"</li>
            <li><strong>Halloween:</strong> Keywords: "halloween", "pumpkin" OR date: Oct 31</li>
            <li><strong>Diwali:</strong> Keywords: "diwali", "deepavali", "festival of lights", "lakshmi puja"</li>
            <li><strong>Holi:</strong> Keywords: "holi", "festival of colors", "rang", "gulal"</li>
            <li><strong>Eid:</strong> Keywords: "eid", "eid al-fitr", "eid al-adha", "ramadan"</li>
            <li><strong>Summer Holiday:</strong> Keywords: "summer holiday", "summer break" OR July/August dates</li>
            <li><strong>Holiday:</strong> Keywords: "half term", "winter break", "spring break", "school holiday"</li>
            <li><strong>Regular:</strong> All other events use default styling</li>
          </ul>
        </div>
      </div>
    </div>
  );
}