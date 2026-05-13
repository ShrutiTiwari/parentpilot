import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Use environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
