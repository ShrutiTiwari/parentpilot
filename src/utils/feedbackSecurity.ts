import { FEEDBACK_SECURITY_CONFIG, type CreateFeedbackInput } from '../types/feedback';

export class FeedbackSecurity {
  /**
   * Validate feedback input for security and abuse prevention
   */
  static validateInput(input: CreateFeedbackInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check subject length
    if (!input.subject || input.subject.trim().length < FEEDBACK_SECURITY_CONFIG.minSubjectLength) {
      errors.push(`Subject must be at least ${FEEDBACK_SECURITY_CONFIG.minSubjectLength} characters`);
    }
    if (input.subject && input.subject.length > FEEDBACK_SECURITY_CONFIG.maxSubjectLength) {
      errors.push(`Subject must be no more than ${FEEDBACK_SECURITY_CONFIG.maxSubjectLength} characters`);
    }

    // Check message length
    if (!input.message || input.message.trim().length < FEEDBACK_SECURITY_CONFIG.minMessageLength) {
      errors.push(`Message must be at least ${FEEDBACK_SECURITY_CONFIG.minMessageLength} characters`);
    }
    if (input.message && input.message.length > FEEDBACK_SECURITY_CONFIG.maxMessageLength) {
      errors.push(`Message must be no more than ${FEEDBACK_SECURITY_CONFIG.maxMessageLength} characters`);
    }

    // Check for suspicious content
    const suspiciousContent = this.detectSuspiciousContent(input.subject + ' ' + input.message);
    if (suspiciousContent.length > 0) {
      errors.push(`Content contains suspicious patterns: ${suspiciousContent.join(', ')}`);
    }

    // Check email format if provided
    if (input.email && !this.isValidEmail(input.email)) {
      errors.push('Please provide a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect suspicious content patterns
   */
  static detectSuspiciousContent(content: string): string[] {
    const suspicious: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for suspicious keywords
    FEEDBACK_SECURITY_CONFIG.suspiciousKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        suspicious.push(`suspicious keyword: "${keyword}"`);
      }
    });

    // Check for excessive capital letters (more than 30% of content)
    const capitalLetters = content.replace(/[^A-Z]/g, '').length;
    const totalLetters = content.replace(/[^A-Za-z]/g, '').length;
    if (totalLetters > 0 && (capitalLetters / totalLetters) > 0.3) {
      suspicious.push('excessive capital letters');
    }

    // Check for excessive exclamation marks
    const exclamationCount = content.replace(/[^!]/g, '').length;
    if (exclamationCount > 5) {
      suspicious.push('excessive exclamation marks');
    }

    // Check for excessive links
    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = content.match(linkRegex) || [];
    if (links.length > 2) {
      suspicious.push('excessive links');
    }

    // Check for repetitive patterns
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    const repetitiveWords = Object.entries(wordCounts)
      .filter(([_, count]) => count > 5)
      .map(([word, _]) => word);
    
    if (repetitiveWords.length > 0) {
      suspicious.push('repetitive content');
    }

    return suspicious;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Check if content is likely spam
   */
  static isSpam(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Common spam indicators
    const spamIndicators = [
      'buy now',
      'click here',
      'free money',
      'limited time',
      'act now',
      'urgent',
      'exclusive offer',
      'guaranteed',
      '100% free',
      'no cost',
      'no obligation'
    ];

    return spamIndicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Generate content hash for duplicate detection
   */
  static generateContentHash(subject: string, message: string): string {
    const content = (subject + ' ' + message).toLowerCase().trim();
    // Simple hash function (in production, use crypto-js or similar)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Rate limiting check (client-side warning)
   */
  static getRateLimitWarning(submissionCount: number, timeWindow: 'hour' | 'day'): string | null {
    const limits = {
      hour: FEEDBACK_SECURITY_CONFIG.maxSubmissionsPerHour,
      day: FEEDBACK_SECURITY_CONFIG.maxSubmissionsPerDay
    };

    const limit = limits[timeWindow];
    const remaining = limit - submissionCount;

    if (remaining <= 0) {
      return `You've reached the maximum number of feedback submissions per ${timeWindow}. Please try again later.`;
    }

    if (remaining <= 2) {
      return `You have ${remaining} feedback submissions remaining this ${timeWindow}.`;
    }

    return null;
  }
} 