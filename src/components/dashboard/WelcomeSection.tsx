
import React from 'react';
import { Info } from 'lucide-react';

export function WelcomeSection() {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Welcome to your family calendar! 📅
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            <strong>Your privacy is protected:</strong> Personal events stay private to you, and you control who sees your school events. 
            Start by adding events that matter to your family.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">🔒 Private by default</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">📱 Easy to add events</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">📸 AI image extraction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
