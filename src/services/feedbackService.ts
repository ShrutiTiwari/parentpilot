import { supabase } from '../lib/supabase';
import { CreateFeedbackInput, FeedbackMessage } from '../types/feedback';
import { FeedbackSecurity } from '../utils/feedbackSecurity';

export class FeedbackService {
  /**
   * Get client IP address (simplified - in production, use proper IP detection)
   */
  private static async getClientIP(): Promise<string | null> {
    try {
      // In a real application, you'd get this from your server
      // For now, we'll return null and let the database handle it
      return null;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }

  /**
   * Submit a new feedback message with enhanced security
   */
  static async submitFeedback(input: CreateFeedbackInput): Promise<FeedbackMessage> {
    try {
      // Client-side validation
      const validation = FeedbackSecurity.validateInput(input);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get browser/device info
      const userAgent = navigator.userAgent;
      const pageUrl = window.location.href;
      const clientIP = await this.getClientIP();
      
      // Sanitize inputs
      const sanitizedInput = {
        ...input,
        subject: FeedbackSecurity.sanitizeInput(input.subject),
        message: FeedbackSecurity.sanitizeInput(input.message),
        email: input.email ? FeedbackSecurity.sanitizeInput(input.email) : undefined
      };

      // Check for spam
      if (FeedbackSecurity.isSpam(sanitizedInput.subject + ' ' + sanitizedInput.message)) {
        console.warn('Potential spam detected in feedback submission');
        // Continue with submission but flag it
      }
      
      const { data, error } = await supabase
        .from('feedback_messages')
        .insert({
          user_id: user?.id || null,
          email: sanitizedInput.email || user?.email || null,
          category: sanitizedInput.category,
          subject: sanitizedInput.subject,
          message: sanitizedInput.message,
          priority: sanitizedInput.priority || 'normal',
          user_agent: userAgent,
          page_url: pageUrl,
          ip_address: clientIP
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting feedback:', error);
        
        // Handle specific error types
        if (error.message.includes('Rate limit exceeded')) {
          throw new Error('You\'ve submitted too much feedback recently. Please try again later.');
        }
        if (error.message.includes('Duplicate content detected')) {
          throw new Error('Similar feedback has already been submitted. Please check if your issue has already been reported.');
        }
        if (error.message.includes('Suspicious content detected')) {
          throw new Error('Your feedback contains suspicious content. Please review and try again.');
        }
        
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback messages for the current user
   */
  static async getUserFeedback(): Promise<FeedbackMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated to view feedback');
      }

      const { data, error } = await supabase
        .from('feedback_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user feedback:', error);
        throw new Error(`Failed to fetch feedback: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserFeedback:', error);
      throw error;
    }
  }

  /**
   * Get user's recent submission count for rate limiting
   */
  static async getUserSubmissionCount(timeWindow: 'hour' | 'day' = 'hour'): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return 0; // Anonymous users are tracked by IP
      }

      const interval = timeWindow === 'hour' ? '1 hour' : '24 hours';
      
      const { count, error } = await supabase
        .from('feedback_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - (timeWindow === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString());

      if (error) {
        console.error('Error fetching submission count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUserSubmissionCount:', error);
      return 0;
    }
  }

  /**
   * Get a specific feedback message by ID
   */
  static async getFeedbackById(id: string): Promise<FeedbackMessage | null> {
    try {
      const { data, error } = await supabase
        .from('feedback_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching feedback by ID:', error);
        throw new Error(`Failed to fetch feedback: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getFeedbackById:', error);
      throw error;
    }
  }

  /**
   * Update feedback status (for admin use)
   */
  static async updateFeedbackStatus(id: string, status: string): Promise<FeedbackMessage> {
    try {
      const { data, error } = await supabase
        .from('feedback_messages')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating feedback status:', error);
        throw new Error(`Failed to update feedback: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateFeedbackStatus:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics (for admin use)
   */
  static async getFeedbackStats() {
    try {
      const { data, error } = await supabase
        .from('feedback_messages')
        .select('category, status, created_at, is_suspicious');

      if (error) {
        console.error('Error fetching feedback stats:', error);
        throw new Error(`Failed to fetch feedback stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        suspicious: data?.filter(f => f.is_suspicious).length || 0,
        recent: data?.filter(f => {
          const created = new Date(f.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created >= weekAgo;
        }).length || 0
      };

      // Count by category and status
      data?.forEach(feedback => {
        stats.byCategory[feedback.category] = (stats.byCategory[feedback.category] || 0) + 1;
        stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getFeedbackStats:', error);
      throw error;
    }
  }
} 