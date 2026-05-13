import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Get the current site URL
const getSiteUrl = () => {
  // In production, use the configured site URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_SITE_URL;
  }
  
  // In development, use current origin to match the running port
  return window.location.origin;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`
    }
  });
  return { data, error };
};

export const signInWithEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Note: This function should only be used in admin contexts
// Requires VITE_SUPABASE_SERVICE_ROLE_KEY to be set
export const deleteUser = async (userId: string) => {
  // Create a new Supabase client with the service role key
  const adminAuthClient = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { error } = await adminAuthClient.auth.admin.deleteUser(userId);
  return { error };
}; 