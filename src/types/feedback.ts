export interface FeedbackMessage {
  id: string;
  user_id?: string;
  email?: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  user_agent?: string;
  page_url?: string;
  ip_address?: string;
  submission_count?: number;
  is_suspicious?: boolean;
  flagged_reason?: string;
  content_hash?: string;
  created_at: string;
  updated_at: string;
}

export type FeedbackCategory = 'bug_report' | 'feature_request' | 'general_feedback' | 'question' | 'other';
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  subject: string;
  message: string;
  priority?: FeedbackPriority;
  email?: string;
}

// Security configuration
export interface FeedbackSecurityConfig {
  maxSubmissionsPerHour: number;
  maxSubmissionsPerDay: number;
  minSubjectLength: number;
  maxSubjectLength: number;
  minMessageLength: number;
  maxMessageLength: number;
  suspiciousKeywords: string[];
}

export const FEEDBACK_SECURITY_CONFIG: FeedbackSecurityConfig = {
  maxSubmissionsPerHour: 5,
  maxSubmissionsPerDay: 10,
  minSubjectLength: 3,
  maxSubjectLength: 100,
  minMessageLength: 10,
  maxMessageLength: 1000,
  suspiciousKeywords: [
    'viagra', 'casino', 'loan', 'credit', 'buy now', 'click here', 
    'free money', 'lottery', 'winner', 'urgent', 'limited time'
  ]
};

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; description: string; icon: string }[] = [
  {
    value: 'bug_report',
    label: 'Bug Report',
    description: 'Report a problem or issue you encountered',
    icon: '🐛'
  },
  {
    value: 'feature_request',
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    icon: '💡'
  },
  {
    value: 'general_feedback',
    label: 'General Feedback',
    description: 'Share your thoughts about the app',
    icon: '💬'
  },
  {
    value: 'question',
    label: 'Question',
    description: 'Ask a question about the app',
    icon: '❓'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else',
    icon: '📝'
  }
];

export const FEEDBACK_PRIORITIES: { value: FeedbackPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
]; 