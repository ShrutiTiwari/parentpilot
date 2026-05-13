import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, type CreateFeedbackInput, type FeedbackCategory, type FeedbackPriority } from '../../types/feedback';
import { FeedbackService } from '../../services/feedbackService';
import { FeedbackSecurity } from '../../utils/feedbackSecurity';
import { useAuth } from '../../contexts/AuthContext';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [formData, setFormData] = useState<CreateFeedbackInput>({
    category: 'general_feedback',
    subject: '',
    message: '',
    priority: 'normal',
    email: user?.email || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  // Load user's submission count for rate limiting
  useEffect(() => {
    if (open && user) {
      loadSubmissionCount();
    }
  }, [open, user]);

  const loadSubmissionCount = async () => {
    try {
      const count = await FeedbackService.getUserSubmissionCount('hour');
      setSubmissionCount(count);
      
      const warning = FeedbackSecurity.getRateLimitWarning(count, 'hour');
      setRateLimitWarning(warning);
    } catch (error) {
      console.error('Error loading submission count:', error);
    }
  };

  const validateForm = () => {
    const validation = FeedbackSecurity.validateInput(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setError(null);
    setValidationErrors([]);

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    // Check rate limiting
    if (rateLimitWarning && rateLimitWarning.includes('reached the maximum')) {
      setError('You have reached the maximum number of feedback submissions. Please try again later.');
      return;
    }

    setStep('submitting');

    try {
      await FeedbackService.submitFeedback(formData);
      setStep('success');
      // Update submission count
      setSubmissionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback');
      setStep('form');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      category: 'general_feedback',
      subject: '',
      message: '',
      priority: 'normal',
      email: user?.email || ''
    });
    setError(null);
    setValidationErrors([]);
    setRateLimitWarning(null);
    onOpenChange(false);
  };

  const selectedCategory = FEEDBACK_CATEGORIES.find(cat => cat.value === formData.category);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl break-words flex items-center gap-2">
                <span>💬</span>
                Send Feedback
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base break-words">
                Help us improve by sharing your thoughts, reporting issues, or requesting features.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Rate Limit Warning */}
              {rateLimitWarning && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-xs sm:text-sm text-orange-800 break-words leading-relaxed">
                    ⚠️ {rateLimitWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Category Selection */}
              <div>
                <Label className="text-sm sm:text-base">What type of feedback is this?</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <Button
                      key={category.value}
                      variant={formData.category === category.value ? "default" : "outline"}
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-xl flex-shrink-0">{category.icon}</span>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base">{category.label}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words leading-relaxed">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject" className="text-sm sm:text-base">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your feedback"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="text-sm sm:text-base"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.subject.length}/100 characters
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message" className="text-sm sm:text-base">
                  Details *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed information..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="text-sm sm:text-base min-h-[120px]"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.message.length}/1000 characters
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority" className="text-sm sm:text-base">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: FeedbackPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <span className={priority.color}>{priority.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email (for anonymous users) */}
              {!user && (
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">
                    Email (optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    We'll use this to follow up on your feedback
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-xs sm:text-sm text-red-800 break-words leading-relaxed">
                    <strong>Please fix the following issues:</strong>
                    <ul className="mt-2 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-xs sm:text-sm text-red-800 break-words leading-relaxed">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Category-specific tips */}
              {selectedCategory && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-xs sm:text-sm break-words leading-relaxed">
                    <strong>💡 Tip for {selectedCategory.label}:</strong> {
                      selectedCategory.value === 'bug_report' 
                        ? 'Please include steps to reproduce the issue and what you expected to happen.'
                        : selectedCategory.value === 'feature_request'
                        ? 'Describe the feature you\'d like and how it would help you.'
                        : selectedCategory.value === 'question'
                        ? 'We\'ll get back to you as soon as possible with an answer.'
                        : 'Your feedback helps us make the app better for everyone.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.subject.trim() || !formData.message.trim() || validationErrors.length > 0}
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
              >
                Send Feedback
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'submitting' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl break-words">Sending Feedback...</DialogTitle>
              <DialogDescription className="text-sm sm:text-base break-words">
                Please wait while we submit your feedback.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl break-words flex items-center gap-2">
                <span>✅</span>
                Feedback Sent!
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base break-words">
                Thank you for your feedback! We'll review it and get back to you if needed.
              </DialogDescription>
            </DialogHeader>

            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-xs sm:text-sm break-words leading-relaxed">
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1">
                  <li>• We'll review your feedback within 24-48 hours</li>
                  <li>• For bug reports, we'll investigate and fix issues</li>
                  <li>• For feature requests, we'll consider them for future updates</li>
                  <li>• We may reach out for more details if needed</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 