import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Heart, X, Star } from 'lucide-react';
import { userFeedbackService, type UserFeedback } from '../../services/userFeedbackService';

interface FeedbackFormProps {
  learnerId: string;
  daysUsed: number;
  sessionsCompleted: number;
  feedbackType: '3_day_early' | '14_day_value' | 'general';
  onClose: () => void;
  onSubmitted?: () => void;
  className?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  learnerId,
  daysUsed,
  sessionsCompleted,
  feedbackType,
  onClose,
  onSubmitted,
  className = ''
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    experience_rating: '' as 'great' | 'okay' | 'struggling' | '',
    success_drivers: [] as string[],
    improvement_needs: [] as string[],
    main_challenges: [] as string[],
    usage_patterns: [] as string[],
    feature_priorities: [] as string[],
    other_success_driver: '',
    other_improvement_need: '',
    other_main_challenge: '',
    other_usage_pattern: '',
    other_feature_priority: '',
    wants_follow_up: false,
    contact_info: '',
    additional_comments: ''
  });

  const handleExperienceRating = (rating: 'great' | 'okay' | 'struggling') => {
    setFormData(prev => ({ ...prev, experience_rating: rating }));
    setStep(2);
  };

  const handleCheckboxChange = (fieldName: string, optionId: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[fieldName as keyof typeof prev] as string[];
      if (checked) {
        return { ...prev, [fieldName]: [...currentArray, optionId] };
      } else {
        return { ...prev, [fieldName]: currentArray.filter(id => id !== optionId) };
      }
    });
  };


  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      userFeedbackService.setCurrentLearner(learnerId);
      
      // Compile structured feedback based on experience rating
      let structuredFeedback = '';
      if (formData.experience_rating === 'great') {
        const drivers = [...formData.success_drivers];
        const otherDriver = formData.other_success_driver ? `Other: ${formData.other_success_driver}` : '';
        if (drivers.includes('other') && otherDriver) {
          drivers[drivers.indexOf('other')] = otherDriver;
        }
        structuredFeedback = `Success Drivers: ${drivers.join(', ')}`;
      } else if (formData.experience_rating === 'okay') {
        const improvements = [...formData.improvement_needs];
        const otherImprovement = formData.other_improvement_need ? `Other: ${formData.other_improvement_need}` : '';
        if (improvements.includes('other') && otherImprovement) {
          improvements[improvements.indexOf('other')] = otherImprovement;
        }
        structuredFeedback = `Improvement Needs: ${improvements.join(', ')}`;
      } else if (formData.experience_rating === 'struggling') {
        const challenges = [...formData.main_challenges];
        const otherChallenge = formData.other_main_challenge ? `Other: ${formData.other_main_challenge}` : '';
        if (challenges.includes('other') && otherChallenge) {
          challenges[challenges.indexOf('other')] = otherChallenge;
        }
        structuredFeedback = `Main Challenges: ${challenges.join(', ')}`;
      }

      // Compile usage patterns and feature priorities
      const usagePatterns = formData.usage_patterns.join(', ');
      const featurePriorities = formData.feature_priorities.join(', ');

      const feedbackData: Omit<UserFeedback, 'id' | 'submitted_at' | 'learner_id'> = {
        feedback_type: feedbackType,
        feedback_trigger: 'automatic_3_day',
        days_used: daysUsed,
        sessions_completed: sessionsCompleted,
        experience_rating: formData.experience_rating || undefined,
        
        // Store structured responses in existing fields
        most_helpful_feature: formData.experience_rating === 'great' ? structuredFeedback : undefined,
        improvement_suggestions: formData.experience_rating === 'okay' ? structuredFeedback : undefined, 
        biggest_challenge: formData.experience_rating === 'struggling' ? structuredFeedback : undefined,
        
        // Store usage pattern and feature priority in what_brought_you_here field
        what_brought_you_here: `Usage: ${usagePatterns} | Priorities: ${featurePriorities}`,
        
        additional_comments: formData.additional_comments || undefined,
        wants_follow_up: false, // Simplified for now
        preferred_contact_method: 'none'
      };

      await userFeedbackService.submitFeedback(feedbackData);
      
      toast({
        title: "Thank you for your feedback! 🎉",
        description: "Your input helps us improve PowerParent for everyone.",
        duration: 4000
      });

      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        duration: 3000,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return "How's your experience so far?";
    if (step === 2) {
      if (formData.experience_rating === 'great') return "What's driving your success?";
      if (formData.experience_rating === 'okay') return "What would make this amazing?";
      if (formData.experience_rating === 'struggling') return "What's your biggest challenge?";
    }
    if (step === 3) return "Help us prioritize";
    return "Almost done!";
  };

  const getProgressWidth = () => {
    if (step === 1) return "25%";
    if (step === 2) return "50%";
    if (step === 3) return "75%";
    return "100%";
  };

  const getSuccessDriverOptions = () => [
    { id: 'timers', label: '⏱️ Practice timers keep me motivated', icon: '⏱️' },
    { id: 'streaks', label: '🔥 Daily streaks push me forward', icon: '🔥' },
    { id: 'curriculum', label: '📚 ABRSM curriculum structure', icon: '📚' },
    { id: 'convenience', label: '🎯 Everything in one place', icon: '🎯' },
    { id: 'progress', label: '📈 Progress tracking shows improvement', icon: '📈' },
    { id: 'other', label: '💭 Something else', icon: '💭' }
  ];

  const getImprovementOptions = () => [
    { id: 'reminders', label: '🔔 Better practice reminders', icon: '🔔' },
    { id: 'visualization', label: '📊 Better progress visualization', icon: '📊' },
    { id: 'teacher', label: '👨‍🏫 Teacher collaboration tools', icon: '👨‍🏫' },
    { id: 'gamification', label: '🎮 More rewards/gamification', icon: '🎮' },
    { id: 'offline', label: '📱 Offline practice mode', icon: '📱' },
    { id: 'simpler', label: '✨ Simpler interface', icon: '✨' },
    { id: 'other', label: '💭 Something else', icon: '💭' }
  ];

  const getChallengeOptions = () => [
    { id: 'confusing', label: '🤔 Too confusing to navigate', icon: '🤔' },
    { id: 'routine', label: '⏰ Doesn\'t fit my practice routine', icon: '⏰' },
    { id: 'features', label: '🔧 Missing features I need', icon: '🔧' },
    { id: 'time', label: '⌚ Takes too much time to use', icon: '⌚' },
    { id: 'bugs', label: '🐛 Technical issues/bugs', icon: '🐛' },
    { id: 'expectations', label: '❓ Not what I expected', icon: '❓' },
    { id: 'other', label: '💭 Something else', icon: '💭' }
  ];

  const getUsagePatternOptions = () => [
    { id: 'quick_tracking', label: '⚡ Quick daily practice tracking', icon: '⚡' },
    { id: 'detailed_planning', label: '📋 Detailed session planning', icon: '📋' },
    { id: 'exam_prep', label: '🎓 Progress monitoring for exams', icon: '🎓' },
    { id: 'habit_building', label: '💪 Habit building/motivation', icon: '💪' },
    { id: 'sharing', label: '👥 Sharing with teacher/parent', icon: '👥' }
  ];

  const getFeaturePriorityOptions = () => [
    { id: 'notifications', label: '🔔 Practice reminders/notifications', icon: '🔔' },
    { id: 'teacher_tools', label: '👨‍🏫 Teacher collaboration features', icon: '👨‍🏫' },
    { id: 'mobile_app', label: '📱 Better mobile app', icon: '📱' },
    { id: 'video_guides', label: '🎥 Video practice guides', icon: '🎥' },
    { id: 'social', label: '👫 Social features (compare progress)', icon: '👫' },
    { id: 'analytics', label: '📊 Advanced analytics', icon: '📊' },
    { id: 'perfect', label: '✅ Nothing needed - it\'s perfect!', icon: '✅' }
  ];

  const isStep1Complete = formData.experience_rating !== '';
  const isStep2Complete = () => {
    if (formData.experience_rating === 'great') return formData.success_drivers.length > 0;
    if (formData.experience_rating === 'okay') return formData.improvement_needs.length > 0;
    if (formData.experience_rating === 'struggling') return formData.main_challenges.length > 0;
    return false;
  };
  const isStep3Complete = formData.usage_patterns.length > 0;
  const isStep4Complete = formData.feature_priorities.length > 0;
  const canSubmit = isStep1Complete;

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Quick Feedback</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: getProgressWidth() }}
          />
        </div>
        
        <div className="text-center mt-3">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">🎁</span>
              <span className="font-semibold text-purple-800">Help shape PowerParent's future</span>
            </div>
            <p className="text-sm text-purple-700">
              Your input helps improve practice for 1,000+ families
            </p>
            <Badge variant="outline" className="text-xs mt-2 bg-white/50">
              ⏱ Takes 30 seconds
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <h3 className="font-medium text-center text-gray-800">
          {getStepTitle()}
        </h3>

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={formData.experience_rating === 'great' ? 'default' : 'outline'}
                onClick={() => handleExperienceRating('great')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <span className="text-2xl mb-1">😊</span>
                <span className="text-xs">Great!</span>
              </Button>
              
              <Button
                variant={formData.experience_rating === 'okay' ? 'default' : 'outline'}
                onClick={() => handleExperienceRating('okay')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <span className="text-2xl mb-1">😐</span>
                <span className="text-xs">Okay</span>
              </Button>
              
              <Button
                variant={formData.experience_rating === 'struggling' ? 'default' : 'outline'}
                onClick={() => handleExperienceRating('struggling')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <span className="text-2xl mb-1">😞</span>
                <span className="text-xs">Struggling</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Context-specific multiple choice */}
        {step === 2 && (
          <div className="space-y-3">
            {formData.experience_rating === 'great' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 text-center mb-3">Select all that apply:</p>
                {getSuccessDriverOptions().map((option) => (
                  <div key={option.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => {
                         const isChecked = formData.success_drivers.includes(option.id);
                         handleCheckboxChange('success_drivers', option.id, !isChecked);
                       }}>
                    <input
                      type="checkbox"
                      checked={formData.success_drivers.includes(option.id)}
                      onChange={() => {}}
                      className="text-purple-600 rounded"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
                {formData.success_drivers.includes('other') && (
                  <Input
                    placeholder="Tell us what's driving your success..."
                    value={formData.other_success_driver}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_success_driver: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {formData.experience_rating === 'okay' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 text-center mb-3">Select all that apply:</p>
                {getImprovementOptions().map((option) => (
                  <div key={option.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => {
                         const isChecked = formData.improvement_needs.includes(option.id);
                         handleCheckboxChange('improvement_needs', option.id, !isChecked);
                       }}>
                    <input
                      type="checkbox"
                      checked={formData.improvement_needs.includes(option.id)}
                      onChange={() => {}}
                      className="text-purple-600 rounded"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
                {formData.improvement_needs.includes('other') && (
                  <Input
                    placeholder="What would make this amazing for you..."
                    value={formData.other_improvement_need}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_improvement_need: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {formData.experience_rating === 'struggling' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 text-center mb-3">Select all that apply:</p>
                {getChallengeOptions().map((option) => (
                  <div key={option.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => {
                         const isChecked = formData.main_challenges.includes(option.id);
                         handleCheckboxChange('main_challenges', option.id, !isChecked);
                       }}>
                    <input
                      type="checkbox"
                      checked={formData.main_challenges.includes(option.id)}
                      onChange={() => {}}
                      className="text-purple-600 rounded"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
                {formData.main_challenges.includes('other') && (
                  <Input
                    placeholder="What's your biggest challenge..."
                    value={formData.other_main_challenge}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_main_challenge: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Usage Pattern */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-3">How do you use PowerParent? (select all that apply)</p>
            {getUsagePatternOptions().map((option) => (
              <div key={option.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => {
                     const isChecked = formData.usage_patterns.includes(option.id);
                     handleCheckboxChange('usage_patterns', option.id, !isChecked);
                   }}>
                <input
                  type="checkbox"
                  checked={formData.usage_patterns.includes(option.id)}
                  onChange={() => {}}
                  className="text-purple-600 rounded"
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Feature Priority */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-3">What should we build next? (select all you'd use)</p>
            {getFeaturePriorityOptions().map((option) => (
              <div key={option.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => {
                     const isChecked = formData.feature_priorities.includes(option.id);
                     handleCheckboxChange('feature_priorities', option.id, !isChecked);
                   }}>
                <input
                  type="checkbox"
                  checked={formData.feature_priorities.includes(option.id)}
                  onChange={() => {}}
                  className="text-purple-600 rounded"
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
            
            {/* Optional final comments */}
            <div className="border-t pt-3 mt-4">
              <Textarea
                placeholder="Any other thoughts or suggestions? (optional)"
                value={formData.additional_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          
          {step === 1 && isStep1Complete && (
            <Button
              onClick={() => setStep(2)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Continue
            </Button>
          )}
          
          {step === 2 && isStep2Complete() && (
            <Button
              onClick={() => setStep(3)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Next
            </Button>
          )}
          
          {step === 3 && isStep3Complete && (
            <Button
              onClick={() => setStep(4)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Almost done
            </Button>
          )}
          
          {step === 4 && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !isStep4Complete}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? 'Submitting...' : '🎉 Send Feedback'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};