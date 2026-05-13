import { supabase } from '@/lib/supabase';
import { DEFAULT_GRADE } from '@/constants/boards';

export type ShareResourceType = 'music' | 'events' | 'both';
export type ShareStatus = 'pending' | 'active' | 'inactive';
export type AccessLevel = 'owner' | 'editor' | 'viewer';

export interface LearnerAccess {
  id: string;
  learner_id: string;
  user_id: string | null;
  access_type: AccessLevel;
  granted_by: string;
  share_code: string | null;
  status: ShareStatus;
  shared_resource: ShareResourceType;
  created_at: string;
}

export interface ShareRequest {
  id: string;
  learner_id: string;
  learner_name: string;
  requester_name: string;
  requester_role: string;
  shared_resource: ShareResourceType;
  created_at: string;
}

export class SharingService {
  /**
   * Submit a share code to request access (with edge function fallback)
   */
  static async submitShareCode(
    shareCode: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Attempting to use edge function for share code:', shareCode);

      // Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke('claim-share-code', {
          body: { shareCode },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log('Edge function response:', { data, error });

        if (!error && data && !data.error) {
          return { 
            success: true, 
            message: data.message 
          };
        }
        
        console.warn('Edge function failed, falling back to direct database approach:', { data, error });
      } catch (edgeError) {
        console.warn('Edge function not available, falling back to direct database approach:', edgeError);
      }

      // Fallback to direct database approach (temporary)
      return await this.submitShareCodeDirect(shareCode);
    } catch (error) {
      console.error('Error in submitShareCode:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Direct database approach (fallback while debugging edge functions)
   */
  private static async submitShareCodeDirect(shareCode: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Using direct database approach for share code:', shareCode);

    // Find the share code
    const { data: shareData, error: fetchError } = await supabase
      .from('learner_access')
      .select('id, learner_id, user_id, granted_by, shared_resource, status, share_code, access_type')
      .eq('share_code', shareCode)
      .not('share_code', 'is', null)
      .single();

    if (fetchError || !shareData) {
      return { success: false, error: 'Invalid or expired share code' };
    }

    // Validate the share code
    if (!shareData.share_code || shareData.access_type !== 'owner') {
      return { success: false, error: 'This share code has already been used or is invalid' };
    }

    if (shareData.granted_by === user.id) {
      return { success: false, error: 'You cannot use your own share code' };
    }

    // Check for existing access
    const { data: existingAccess } = await supabase
      .from('learner_access')
      .select('id')
      .eq('learner_id', shareData.learner_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingAccess) {
      return { success: false, error: 'You already have access to this student' };
    }

    // Clear share code and create new access record
    const { error: clearError } = await supabase
      .from('learner_access')
      .update({ share_code: null })
      .eq('id', shareData.id);

    if (clearError) {
      console.error('Error clearing share code:', clearError);
      return { success: false, error: 'Failed to process share code' };
    }

    const { error: insertError } = await supabase
      .from('learner_access')
      .insert({
        learner_id: shareData.learner_id,
        user_id: user.id,
        access_type: 'viewer',
        granted_by: shareData.granted_by,
        status: 'pending',
        shared_resource: shareData.shared_resource,
        share_code: null
      });

    if (insertError) {
      console.error('Error creating access record:', insertError);
      // Try to restore share code
      await supabase
        .from('learner_access')
        .update({ share_code: shareCode })
        .eq('id', shareData.id);
      return { success: false, error: 'Failed to create access request due to database permissions' };
    }

    return { 
      success: true, 
      message: `Access request sent for learner's ${shareData.shared_resource} progress` 
    };
  }

  /**
   * Get pending share requests for current user's learners
   */
  static async getPendingRequests(): Promise<ShareRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log('Fetching pending requests for user:', user.id);

      // Use simple query since joins don't work due to missing foreign keys
      const { data, error } = await supabase
        .from('learner_access')
        .select('id, learner_id, shared_resource, created_at, user_id, granted_by')
        .eq('granted_by', user.id)
        .eq('status', 'pending');
      
      console.log('Raw pending requests data:', { data, error });
      
      if (error) {
        console.error('Error fetching pending requests:', error);
        return [];
      }

      // Filter to only show requests where someone else has claimed the code
      const claimedRequests = data?.filter(item => {
        const isClaimedByOther = item.user_id !== item.granted_by;
        console.log('Filtering item:', { 
          id: item.id, 
          user_id: item.user_id, 
          granted_by: item.granted_by, 
          isClaimedByOther 
        });
        return isClaimedByOther;
      }) || [];
      
      console.log('Filtered claimed requests:', claimedRequests);

      // Use edge function to get student and user details (bypasses RLS)
      try {
        const studentIds = claimedRequests.map(item => item.learner_id);
        const userIds = claimedRequests.map(item => item.user_id);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && (studentIds.length > 0 || userIds.length > 0)) {
          const { data: detailsResult, error: detailsError } = await supabase.functions.invoke('get-student-details', {
            body: { 
              studentIds,
              userIds,
              includeStudents: true,
              includeProfiles: true
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          console.log('Edge function result for requests:', { detailsResult, detailsError });

          if (!detailsError && detailsResult?.success) {
            const { students, profiles } = detailsResult.data;
            
            const enrichedRequests = claimedRequests.map(item => {
              const student = students[item.learner_id];
              const profile = profiles[item.user_id];
              
              return {
                id: item.id,
                learner_id: item.learner_id,
                learner_name: student?.name || `Student ${item.learner_id.slice(-6)}`,
                requester_name: profile?.full_name || `User ${item.user_id.slice(-6)}`,
                requester_role: profile?.role_type || 'parent',
                shared_resource: item.shared_resource,
                created_at: item.created_at
              };
            });

            console.log('Enriched requests with real data:', enrichedRequests);
            return enrichedRequests;
          }
        }
      } catch (error) {
        console.warn('Edge function failed, using fallback:', error);
      }

      // Fallback if edge function fails
      const enrichedRequests = claimedRequests.map(item => ({
        id: item.id,
        learner_id: item.learner_id,
        learner_name: `Student ${item.learner_id.slice(-6)}`,
        requester_name: `User ${item.user_id.slice(-6)}`,
        requester_role: 'parent',
        shared_resource: item.shared_resource,
        created_at: item.created_at
      }));

      console.log('Enriched requests (fallback mode):', enrichedRequests);
      return enrichedRequests;
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      return [];
    }
  }

  /**
   * Approve a share request (using edge function)
   */
  static async approveShareRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    return this.processShareRequest(requestId, 'approve');
  }

  /**
   * Reject a share request (using edge function)
   */
  static async rejectShareRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    return this.processShareRequest(requestId, 'reject');
  }

  /**
   * Process share request (approve/reject) using edge function
   */
  private static async processShareRequest(requestId: string, action: 'approve' | 'reject'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Calling edge function to process share request:', { requestId, action });

      const { data, error } = await supabase.functions.invoke('approve-share-request', {
        body: { requestId, action },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to process request' };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in processShareRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get students that have been shared with the current user
   */
  static async getSharedStudents(): Promise<any[]> {
    return this.getSharedStudentsForUser();
  }

  /**
   * Get students accessible to a specific user (parameterized version)
   * @param userId - The ID of the user to fetch learners for (if not provided, uses current user)
   */
  static async getSharedStudentsForUser(userId?: string): Promise<any[]> {
    console.log('🔍 LEARNER_ACCESS_DEBUG: getSharedStudentsForUser called with userId:', userId);
    try {
      // If no userId provided, get current user
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 LEARNER_ACCESS_DEBUG: Current user from auth:', user?.id);
        if (!user) return [];
        targetUserId = user.id;
      }

      console.log('🔍 LEARNER_ACCESS_DEBUG: Fetching shared students for user:', targetUserId);

      const { data, error } = await supabase
        .from('learner_access')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: true }); 

      console.log('🔍 LEARNER_ACCESS_DEBUG: Learner_access query result:', {
        recordsFound: data?.length,
        learnerIds: data?.map(r => r.learner_id),
        error: error?.message,
        userSearchingFor: targetUserId
      });

      if (error) {
        console.error('🔍 LEARNER_ACCESS_DEBUG: ❌ Error fetching shared students:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('🔍 LEARNER_ACCESS_DEBUG: ❌ No learner_access records found for user');
        return [];
      }

      // Use edge function to get student details (bypasses RLS)
      try {
        const studentIds = data.map(record => record.learner_id);
        const { data: { session } } = await supabase.auth.getSession();

        if (session && studentIds.length > 0) {
          const { data: detailsResult, error: detailsError } = await supabase.functions.invoke('get-student-details', {
            body: {
              studentIds,
              includeStudents: true,
              includeProfiles: false
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          console.log('Edge function result for students:', { detailsResult, detailsError });

          if (!detailsError && detailsResult?.success) {
            const studentDetails = detailsResult.data.students;

            const enrichedStudents = data.map(accessRecord => {
              const student = studentDetails[accessRecord.learner_id];              
              return {
                ...accessRecord,
                // Use real student data or fallback
                name: student?.name || `Student ${accessRecord.learner_id.slice(-6)}`,
                instrument: student?.instrument || 'Music',
                current_grade: student?.current_grade ?? DEFAULT_GRADE,
                target_exam_date: student?.target_exam_date,
                created_at: student?.created_at || accessRecord.created_at,
                learner_type: student?.learner_type || 'child',
                parent_name: student?.parent_name,
                share_token: student?.share_token,

                // Add the learner_id for navigation
                id: accessRecord.learner_id
              };
            });

            console.log('Enriched students with real data:', enrichedStudents);
            return enrichedStudents;
          }
        }
      } catch (error) {
        console.warn('Edge function failed, using fallback:', error);
      }

      // Fallback if edge function fails
      const enrichedStudents = data.map(accessRecord => ({
        ...accessRecord,
        name: `Student ${accessRecord.learner_id.slice(-6)}`,
        instrument: 'Music',
        current_grade: DEFAULT_GRADE,
        id: accessRecord.learner_id
      }));

      console.log('Enriched students (fallback mode):', enrichedStudents);
      return enrichedStudents;
    } catch (error) {
      console.error('Error in getSharedStudentsForUser:', error);
      return [];
    }
  }

  /**
   * Revoke access to a shared learner
   */
  static async revokeAccess(accessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('learner_access')
        .update({ status: 'inactive' })
        .eq('id', accessId);

      if (error) {
        console.error('Error revoking access:', error);
        return { success: false, error: 'Failed to revoke access' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in revokeAccess:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Fix missing owner access records (development helper)
   */
  static async fixMissingOwnerAccess(): Promise<{ success: boolean; created: number; updated: number; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, created: 0, updated: 0, error: 'User not authenticated' };

      // Find students created by user
      const { data: userStudents } = await supabase
        .from('music_learners')
        .select('id, name')
        .eq('created_by_user_id', user.id);

      if (!userStudents) return { success: true, created: 0, updated: 0 };

      let created = 0;
      let updated = 0;
      
      for (const student of userStudents) {
        // Check if owner access already exists
        const { data: existingAccess } = await supabase
          .from('learner_access')
          .select('id, status')
          .eq('learner_id', student.id)
          .eq('user_id', user.id)
          .eq('access_type', 'owner')
          .single();

        if (!existingAccess) {
          // Create missing owner access
          const { error } = await supabase
            .from('learner_access')
            .insert({
              learner_id: student.id,
              user_id: user.id,
              access_type: 'owner',
              granted_by: user.id,
              status: 'active',
              shared_resource: 'music'
            });

          if (!error) {
            console.log('Created owner access for:', student.name);
            created++;
          }
        } else if (existingAccess.status !== 'active') {
          // Fix existing owner record with wrong status
          const { error } = await supabase
            .from('learner_access')
            .update({ status: 'active' })
            .eq('id', existingAccess.id);

          if (!error) {
            console.log('Fixed owner access status for:', student.name);
            updated++;
          }
        }
      }

      return { success: true, created, updated };
    } catch (error) {
      return { success: false, created: 0, updated: 0, error: error.message };
    }
  }

  /**
   * Search for users by role, name, and/or email with flexible criteria
   * Uses edge function to bypass RLS restrictions
   */
  static async searchUsersByFields(
    searchCriteria: { role?: string; name?: string; email?: string }
  ): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🔍 Attempting user search with edge function:', searchCriteria);

      // Try edge function first (bypasses RLS)
      try {
        const { data, error } = await supabase.functions.invoke('search-users', {
          body: { 
            searchCriteria: {
              role: searchCriteria.role || undefined,
              name: searchCriteria.name?.trim() || undefined,
              email: searchCriteria.email?.trim() || undefined
            }
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log('🔍 Edge function response:', { data, error });

        if (!error && data && !data.error) {
          return { 
            success: true, 
            users: data.users || []
          };
        }
        
        console.warn('Edge function failed, falling back to direct approach:', { data, error });
      } catch (edgeError) {
        console.warn('Edge function not available, falling back to direct approach:', edgeError);
      }

      // Fallback to direct database approach (will likely fail due to RLS, but good for debugging)
      return await this.searchUsersDirectFallback(searchCriteria);
      
    } catch (error) {
      console.error('Error in searchUsersByFields:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Direct database fallback (for debugging RLS issues)
   */
  private static async searchUsersDirectFallback(
    searchCriteria: { role?: string; name?: string; email?: string }
  ): Promise<{ success: boolean; users?: any[]; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    console.log('🔍 Using direct database fallback (likely to fail due to RLS)');

    // This will likely return empty due to RLS, but helps with debugging
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, full_name, role_type')
      .neq('id', user.id)
      .limit(10);

    if (searchError) {
      console.error('Direct search error (expected due to RLS):', searchError);
      return { 
        success: false, 
        error: 'Search unavailable - requires edge function for cross-user profile access' 
      };
    }

    if (!profiles || profiles.length === 0) {
      return { 
        success: false, 
        error: 'No users found. This feature requires an edge function to bypass security restrictions.' 
      };
    }

    // If we somehow get results, process them normally
    const enrichedUsers = profiles.map(profile => ({
      ...profile,
      learner_count: 0, // Can't get learner counts due to RLS
      display_name: profile.full_name || `User ${profile.id.slice(-6)}`,
      role_display: profile.role_type || 'user'
    }));

    return { success: true, users: enrichedUsers };
  }

  /**
   * Search for users by query string (legacy - for backward compatibility)
   */
  static async searchUsers(
    query: string
  ): Promise<{ success: boolean; users?: any[]; error?: string }> {
    // Convert legacy query to field-based search
    return this.searchUsersByFields({ name: query, role: query });
  }

  /**
   * Get learners for a specific user (for selection) - uses same format as getSharedStudents
   */
  static async getUserLearners(
    userId?: string
  ): Promise<{ success: boolean; learners?: any[]; error?: string }> {
    try {
      const sharedStudents = await this.getSharedStudentsForUser(userId);
      return { success: true, learners: sharedStudents };
    } catch (error) {
      console.error('Error in getUserLearners:', error);
      return { success: false, error: 'Failed to fetch learners' };
    }
  }

  /**
   * NEW: Send user-to-user connection request (separate from learner sharing)
   */
  static async sendConnectionRequest(
    recipientId: string,
    message?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('user_connections')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .single();

      if (existingConnection) {
        if (existingConnection.status === 'pending') {
          return { success: false, error: 'Connection request already pending' };
        } else if (existingConnection.status === 'accepted') {
          return { success: false, error: 'You are already connected with this user' };
        }
      }

      // Create connection request
      const { error: insertError } = await supabase
        .from('user_connections')
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: 'pending',
          message: message || null
        });

      if (insertError) {
        console.error('Error creating connection request:', insertError);
        return { success: false, error: 'Failed to send connection request' };
      }

      // Get recipient name for confirmation message
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', recipientId)
        .single();

      const recipientName = recipientProfile?.full_name || 'User';

      return { 
        success: true, 
        message: `Connection request sent to ${recipientName}. They can accept it in their connection requests.` 
      };
    } catch (error) {
      console.error('Error in sendConnectionRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * NEW: Get pending connection requests for current user
   */
  static async getPendingConnectionRequests(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Use dedicated edge function to get connection requests with profile details (bypasses RLS)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: result, error } = await supabase.functions.invoke('get-pending-requests', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error calling get-pending-requests:', error);
          return [];
        }

        if (result?.success && result?.connectionRequests) {
          return result.connectionRequests;
        }
      }

      return [];
    } catch (error) {
      console.error('Error in getPendingConnectionRequests:', error);
      return [];
    }
  }

  /**
   * UTILITY: Get user profiles by IDs - reusable across all services
   */
  static async getUserProfiles(userIds: string[]): Promise<Record<string, any>> {
    try {
      if (!userIds || userIds.length === 0) return {};

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: result, error } = await supabase.functions.invoke('get-user-profiles', {
          body: { userIds },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error calling get-user-profiles:', error);
          return {};
        }

        if (result?.success && result?.profileMap) {
          return result.profileMap;
        }
      }

      return {};
    } catch (error) {
      console.error('Error in getUserProfiles:', error);
      return {};
    }
  }

  /**
   * NEW: Get accepted connections for current user
   */
  static async getMyConnections(learnerId?: string): Promise<any[]> {
    console.log('🚀 NEW getMyConnections method called - version 2.0');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found for getMyConnections');
        return [];
      }

      console.log('Fetching connections for user:', user.id);

      // Get accepted connections directly from database
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select('id, requester_id, recipient_id, message, created_at, status')
        .or(`recipient_id.eq.${user.id},requester_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }

      console.log('Raw connections from DB:', connections);

      if (!connections || connections.length === 0) {
        return [];
      }

      // Get all unique user IDs for profile lookup
      const userIds = [...new Set([
        ...connections.map(conn => conn.requester_id),
        ...connections.map(conn => conn.recipient_id)
      ])];

      console.log('Fetching profiles for user IDs:', userIds);

      // Use the reusable profile fetching utility
      const profileMap = await this.getUserProfiles(userIds);
      console.log('Profile map received:', profileMap);

      // Get primary teacher information
      const primaryTeacherMap = {};

      if (learnerId) {
        // If specific learner ID provided, only get teacher access for that learner
        const { data: learnerAccess, error: accessError } = await supabase
          .from('learner_access')
          .select('user_id, learner_id, is_primary_teacher')
          .eq('learner_id', learnerId)
          .eq('status', 'active');

        console.log('Primary teacher access data for learner:', learnerId, { learnerAccess, accessError });

        // Create a map of teacher_id (user_id) -> is_primary_teacher for quick lookup
        if (learnerAccess) {
          learnerAccess.forEach(access => {
            primaryTeacherMap[access.user_id] = access.is_primary_teacher;
          });
        }
      } else {
        // If no learner ID, get for all user's learners (original behavior)
        const { data: userLearners, error: learnersError } = await supabase
          .from('music_learners')
          .select('id')
          .eq('created_by_user_id', user.id);

        console.log('Current user learners:', { userLearners, learnersError });

        if (userLearners && userLearners.length > 0) {
          const learnerIds = userLearners.map(learner => learner.id);

          const { data: learnerAccess, error: accessError } = await supabase
            .from('learner_access')
            .select('user_id, learner_id, is_primary_teacher')
            .in('learner_id', learnerIds)
            .eq('is_primary_teacher', true);

          console.log('Primary teacher access data:', { learnerAccess, accessError });

          if (learnerAccess) {
            learnerAccess.forEach(access => {
              primaryTeacherMap[access.user_id] = access.is_primary_teacher;
            });
          }
        }
      }

      // Format connections with profile data
      const formattedConnections = connections.map(connection => {
        const otherPersonId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
        const isOutgoing = connection.requester_id === user.id;
        
        return {
          id: connection.id,
          requester_id: connection.requester_id,
          recipient_id: connection.recipient_id,
          message: connection.message,
          created_at: connection.created_at,
          status: connection.status,
          isOutgoing: isOutgoing,
          // For display purposes, show the other person's info
          other_user_name: profileMap[otherPersonId]?.full_name || 'Unknown User',
          other_user_role: profileMap[otherPersonId]?.role_type || 'user',
          other_user_id: otherPersonId,
          // Keep original requester info for backwards compatibility
          requester_name: profileMap[connection.requester_id]?.full_name || 'Unknown User',
          requester_role: profileMap[connection.requester_id]?.role_type || 'user',
          // Add primary teacher information
          is_primary_teacher: primaryTeacherMap[otherPersonId] || false
        };
      });

      console.log('Formatted connections:', formattedConnections);
      return formattedConnections;
    } catch (error) {
      console.error('Error in getMyConnections:', error);
      return [];
    }
  }

  /**
   * NEW: Share learner progress with an accepted connection
   */
  static async shareWithConnection(learnerId: string, connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // First, verify the connection exists and is accepted
      const { data: connection, error: connectionError } = await supabase
        .from('user_connections')
        .select('id, requester_id, recipient_id, status')
        .eq('id', connectionId)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Connection not found or not accepted' };
      }

      // Determine who we're sharing with (the other person in the connection)
      const sharedWithUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;

      // Check if sharing already exists
      const { data: existingAccess } = await supabase
        .from('learner_access')
        .select('id')
        .eq('learner_id', learnerId)
        .eq('user_id', sharedWithUserId)
        .eq('status', 'active')
        .single();

      if (existingAccess) {
        return { success: false, error: 'Progress is already shared with this user' };
      }

      // Create the learner access record
      const { error: accessError } = await supabase
        .from('learner_access')
        .insert({
          learner_id: learnerId,
          user_id: sharedWithUserId,
          access_type: 'viewer',
          granted_by: user.id,
          status: 'active',
          shared_resource: 'music', // Default to music progress
          share_code: null // Connection-based sharing doesn't use codes
          // Note: connection_id field will be added later via migration
        });

      if (accessError) {
        console.error('Error creating learner access:', accessError);
        return { success: false, error: 'Failed to share progress' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in shareWithConnection:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * NEW: Accept connection request
   */
  static async acceptConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting connection:', error);
        return { success: false, error: 'Failed to accept connection' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in acceptConnectionRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * NEW: Reject connection request
   */
  static async rejectConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting connection:', error);
        return { success: false, error: 'Failed to reject connection' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in rejectConnectionRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }


  /**
   * EXISTING: Send connection request for specific learner (UNCHANGED)
   */
  static async sendLearnerConnectionRequest(
    learnerId: string,
    recipientId: string,
    message?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get sender's profile info
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, role_type')
        .eq('id', user.id)
        .single();

      // Get recipient's profile info
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('full_name, role_type')
        .eq('id', recipientId)
        .single();

      if (!recipientProfile) {
        return { success: false, error: 'Recipient not found' };
      }

      // Verify learner belongs to recipient
      const { data: learner } = await supabase
        .from('music_learners')
        .select('name')
        .eq('id', learnerId)
        .eq('created_by_user_id', recipientId)
        .single();

      if (!learner) {
        return { success: false, error: 'Learner not found or access denied' };
      }

      // Check for existing connection request
      const { data: existingRequest } = await supabase
        .from('learner_access')
        .select('id, status')
        .eq('learner_id', learnerId)
        .eq('user_id', user.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return { 
            success: false, 
            error: `You already have a pending request for ${learner.name}` 
          };
        } else if (existingRequest.status === 'active') {
          return { 
            success: false, 
            error: `You already have access to ${learner.name}` 
          };
        }
      }

      // Create connection request
      const { error: insertError } = await supabase
        .from('learner_access')
        .insert({
          learner_id: learnerId,
          user_id: user.id,
          access_type: 'viewer',
          granted_by: recipientId,
          status: 'pending',
          shared_resource: 'music',
          share_code: null
        });

      if (insertError) {
        console.error('Error creating learner connection request:', insertError);
        return { 
          success: false, 
          error: 'Failed to send connection request. Please try again.' 
        };
      }

      const senderName = senderProfile?.full_name || user.email;
      const recipientName = recipientProfile.full_name || 'User';

      return { 
        success: true, 
        message: `Connection request sent to ${recipientName} for ${learner.name}. They will see your request in their Pending Approvals tab.` 
      };
    } catch (error) {
      console.error('Error in sendLearnerConnectionRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Send email-based connection request (legacy - for backward compatibility)
   */
  static async sendEmailConnectionRequest(
    recipientEmail: string,
    message?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get sender's profile info
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, role_type')
        .eq('id', user.id)
        .single();

      // Find recipient by email
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, full_name, role_type')
        .eq('email', recipientEmail)
        .single();

      if (recipientError || !recipientProfile) {
        return { 
          success: false, 
          error: 'User with this email address not found. They may need to sign up first.' 
        };
      }

      if (recipientProfile.id === user.id) {
        return { success: false, error: 'You cannot send a connection request to yourself' };
      }

      // Find recipient's learners (they need to have at least one learner to share)
      const { data: recipientLearners } = await supabase
        .from('music_learners')
        .select('id, name')
        .eq('created_by_user_id', recipientProfile.id)
        .limit(1);

      if (!recipientLearners || recipientLearners.length === 0) {
        return { 
          success: false, 
          error: 'This user has no learners to share yet' 
        };
      }

      // Use the first learner for the connection request
      const targetLearnerId = recipientLearners[0].id;

      // Check if connection request already exists
      const { data: existingRequest } = await supabase
        .from('learner_access')
        .select('id, status')
        .eq('learner_id', targetLearnerId)
        .eq('user_id', user.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return { 
            success: false, 
            error: 'You already have a pending connection request with this user' 
          };
        } else if (existingRequest.status === 'active') {
          return { 
            success: false, 
            error: 'You already have an active connection with this user' 
          };
        }
      }

      // Create connection request
      const { error: insertError } = await supabase
        .from('learner_access')
        .insert({
          learner_id: targetLearnerId,
          user_id: user.id,
          access_type: 'viewer',
          granted_by: recipientProfile.id,
          status: 'pending',
          shared_resource: 'music',
          share_code: null
        });

      if (insertError) {
        console.error('Error creating email connection request:', insertError);
        return { 
          success: false, 
          error: 'Failed to send connection request. Please try again.' 
        };
      }

      const senderName = senderProfile?.full_name || user.email;
      const recipientName = recipientProfile.full_name || recipientEmail;

      return { 
        success: true, 
        message: `Connection request sent to ${recipientName}. They will see your request in their Pending Approvals tab.` 
      };
    } catch (error) {
      console.error('Error in sendEmailConnectionRequest:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all shares created by current user
   */
  static async getMyShares(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('learner_access')
        .select('*')
        .eq('granted_by', user.id)
        .in('status', ['active', 'inactive']); // Only show approved/rejected shares

      if (error) {
        console.error('Error fetching my shares:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMyShares:', error);
      return [];
    }
  }
}

export default SharingService;