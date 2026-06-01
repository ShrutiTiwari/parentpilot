import { useState, useEffect } from 'react';
import { userFeedbackService } from '../services/userFeedbackService';

interface FeedbackEligibility {
  isEligibleFor3Day: boolean;
  isEligibleFor14Day: boolean;
  daysUsed: number;
  sessionsCompleted: number;
  hasSubmitted3Day: boolean;
  hasSubmitted14Day: boolean;
  loading: boolean;
}

export const useFeedbackEligibility = (learnerId: string | null) => {
  const [eligibility, setEligibility] = useState<FeedbackEligibility>({
    isEligibleFor3Day: false,
    isEligibleFor14Day: false,
    daysUsed: 0,
    sessionsCompleted: 0,
    hasSubmitted3Day: false,
    hasSubmitted14Day: false,
    loading: true
  });

  useEffect(() => {
    if (!learnerId || learnerId === 'demo-learner') {
      setEligibility({
        isEligibleFor3Day: false,
        isEligibleFor14Day: false,
        daysUsed: 0,
        sessionsCompleted: 0,
        hasSubmitted3Day: false,
        hasSubmitted14Day: false,
        loading: false
      });
      return;
    }

    checkEligibility();
  }, [learnerId]);

  const checkEligibility = async () => {
    if (!learnerId || learnerId === 'demo-learner') return;

    setEligibility(prev => ({ ...prev, loading: true }));

    try {
      userFeedbackService.setCurrentLearner(learnerId);

      // Calculate usage stats
      const stats = await userFeedbackService.calculateUsageStats(learnerId);
      
      // Check if feedback has already been submitted
      const [hasSubmitted3Day, hasSubmitted14Day] = await Promise.all([
        userFeedbackService.hasFeedbackForType('3_day_early'),
        userFeedbackService.hasFeedbackForType('14_day_value')
      ]);

      // Determine eligibility
      const isEligibleFor3Day = stats.daysUsed >= 3 && !hasSubmitted3Day;
      const isEligibleFor14Day = stats.daysUsed >= 14 && !hasSubmitted14Day;

      setEligibility({
        isEligibleFor3Day,
        isEligibleFor14Day,
        daysUsed: stats.daysUsed,
        sessionsCompleted: stats.sessionsCompleted,
        hasSubmitted3Day,
        hasSubmitted14Day,
        loading: false
      });

    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      setEligibility(prev => ({ ...prev, loading: false }));
    }
  };

  const markFeedbackSubmitted = (feedbackType: '3_day_early' | '14_day_value') => {
    setEligibility(prev => ({
      ...prev,
      hasSubmitted3Day: feedbackType === '3_day_early' ? true : prev.hasSubmitted3Day,
      hasSubmitted14Day: feedbackType === '14_day_value' ? true : prev.hasSubmitted14Day,
      isEligibleFor3Day: feedbackType === '3_day_early' ? false : prev.isEligibleFor3Day,
      isEligibleFor14Day: feedbackType === '14_day_value' ? false : prev.isEligibleFor14Day
    }));
  };

  const refreshEligibility = () => {
    checkEligibility();
  };

  return {
    ...eligibility,
    markFeedbackSubmitted,
    refreshEligibility
  };
};