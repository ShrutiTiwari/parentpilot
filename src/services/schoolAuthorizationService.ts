import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type SchoolAuthorization = Database['public']['Tables']['school_authorizations']['Row'];

export const schoolAuthorizationService = {
  // Validate school code and create authorization
  async validateAndAuthorize(schoolCode: string): Promise<{ school: SchoolAuthorization, isNew: boolean }> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Find school by code
    let { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('school_code', schoolCode)
      .single();

    if (schoolError || !school) {
      throw new Error('Invalid school code');
    }

    // If this is a duplicate, fetch the original school
    if (school.duplicate_of) {
      const { data: originalSchool, error: originalError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', school.duplicate_of)
        .single();
      if (originalError || !originalSchool) {
        throw new Error('Original school not found for duplicate');
      }
      school = originalSchool;
    }

    // Check if user already has access
    const { data: existingAuth, error: authError } = await supabase
      .from('school_authorizations')
      .select('id, user_id, school_id, school_code, is_approved, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('school_id', school.id)
      .eq('is_approved', true)
      .single();

    if (authError && authError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing authorization:', authError);
      throw new Error('Error checking existing authorization');
    }

    // If user already has access, return success
    if (existingAuth) {
      return { school, isNew: false };
    }

    // Create new authorization
    const { error: createError } = await supabase
      .from('school_authorizations')
      .insert({
        user_id: user.id,
        school_id: school.id,
        school_code: school.school_code,
        is_approved: true
      });

    if (createError) {
      console.error('Error creating school authorization:', createError);
      throw new Error('Failed to create school authorization');
    }

    return { school, isNew: true };
  },

  // Get user's authorized schools
  async getAuthorizedSchools(): Promise<SchoolAuthorization[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    //console.log('Fetching authorized schools for user:', user.id);

    const { data, error } = await supabase
      .from('school_authorizations')
      .select(`
        id,
        user_id,
        school_id,
        school_code,
        is_approved,
        created_at,
        updated_at,
        schools:school_id (
          id,
          name,
          school_code
        )
      `)
      .eq('user_id', user.id)
      .eq('is_approved', true);

    if (error) {
      console.error('Error fetching authorized schools:', error);
      throw new Error('Failed to fetch authorized schools');
    }


    return data || [];
  },

  // Remove school authorization
  async removeAuthorization(schoolId: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('school_authorizations')
      .delete()
      .eq('user_id', user.id)
      .eq('school_id', schoolId);

    if (error) {
      console.error('Error removing authorization:', error);
      throw new Error('Failed to remove school authorization');
    }
  },

  // Check if current user is an admin for a given school
  async isUserSchoolAdmin(schoolId: string): Promise<boolean> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;
    const { data: adminRow } = await supabase
      .from('school_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('school_id', schoolId)
      .single();
    return !!adminRow;
  }
}; 