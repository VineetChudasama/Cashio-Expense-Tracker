import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sign up or send OTP with Supabase
 */
export async function supabaseSignUp(email, password, options = {}) {
  if (!supabase) return { success: false, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Verify OTP with Supabase
 */
export async function supabaseVerifyOtp(email, token, type = 'signup') {
  if (!supabase) return { success: false, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
