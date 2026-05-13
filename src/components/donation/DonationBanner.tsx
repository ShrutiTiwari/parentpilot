import React, { useState, useEffect } from 'react';
import { DonationCard } from './DonationCard';

interface DonationBannerProps {
  showAfterDays?: number; // Show after user has been using the app for X days
  showAfterSessions?: number; // Show after X practice sessions
  className?: string;
}

export function DonationBanner({ 
  showAfterDays = 3, 
  showAfterSessions = 10,
  className = '' 
}: DonationBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner permanently
    const dismissedUntil = localStorage.getItem('donation_banner_dismissed_until');
    if (dismissedUntil && new Date() < new Date(dismissedUntil)) {
      return;
    }

    // Check if user has dismissed for this session
    const sessionDismissed = sessionStorage.getItem('donation_banner_dismissed');
    if (sessionDismissed) {
      return;
    }

    // Track first visit
    const firstVisit = localStorage.getItem('app_first_visit');
    if (!firstVisit) {
      localStorage.setItem('app_first_visit', new Date().toISOString());
      return; // Don't show on first visit
    }

    // Check days since first visit
    const daysSinceFirstVisit = Math.floor(
      (Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get practice session count (you can integrate with your practice tracking)
    const practiceCount = parseInt(localStorage.getItem('total_practice_sessions') || '0');

    // Show if criteria met
    if (daysSinceFirstVisit >= showAfterDays || practiceCount >= showAfterSessions) {
      setShouldShow(true);
    }
  }, [showAfterDays, showAfterSessions]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Don't show again this session
    sessionStorage.setItem('donation_banner_dismissed', 'true');
  };

  const handleDismissLater = () => {
    setIsDismissed(true);
    // Don't show again for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem('donation_banner_dismissed_until', dismissUntil.toISOString());
  };

  if (!shouldShow || isDismissed) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[999] max-w-sm ${className}`}>
      <DonationCard 
        variant="banner"
        showCloseButton={true}
        onClose={handleDismiss}
        className="shadow-2xl animate-in slide-in-from-right duration-500"
      />
      <div className="mt-2 text-center">
        <button
          onClick={handleDismissLater}
          className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}

export default DonationBanner;