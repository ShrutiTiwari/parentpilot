import React from 'react';

export function PersonalEventsEmptyState() {
  return (
    <div className="text-center py-8 sm:py-10 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-purple-900 mb-3">
          Start your personal calendar! 🎉
        </h3>
        <p className="text-purple-700 mb-6">
          Add birthdays, appointments, family events, or anything important to your family. 
          These events are completely private to you.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/50 rounded-lg p-3">
            <span className="text-2xl block mb-1">🎂</span>
            <span className="text-purple-800 font-medium">Birthdays</span>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <span className="text-2xl block mb-1">🏥</span>
            <span className="text-purple-800 font-medium">Appointments</span>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <span className="text-2xl block mb-1">👨‍👩‍👧‍👦</span>
            <span className="text-purple-800 font-medium">Family Time</span>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <span className="text-2xl block mb-1">✈️</span>
            <span className="text-purple-800 font-medium">Holidays</span>
          </div>
        </div>
      </div>
    </div>
  );
}
