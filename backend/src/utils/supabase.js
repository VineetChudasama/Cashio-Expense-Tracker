import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let supabaseAdminClient = null;

export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && url.includes('supabase.co'));
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return supabaseClient;
}

export function getSupabaseAdminClient() {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !serviceKey) return null;
  supabaseAdminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return supabaseAdminClient;
}

/**
 * Sign up a user in Supabase Auth to trigger real confirmation email / OTP
 */
export async function signUpWithSupabase(email, password, name) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase is not configured in .env' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name
        }
      }
    });

    if (error) {
      // If user already exists in Supabase auth, resend OTP
      if (error.message.toLowerCase().includes('already registered')) {
        const resendRes = await resendSupabaseOtp(email);
        return resendRes;
      }
      console.warn('[SUPABASE AUTH] SignUp notice:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE AUTH] Verification email dispatched by Supabase to ${email}`);
    return { success: true, data };
  } catch (err) {
    console.warn('[SUPABASE AUTH] SignUp error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Trigger Supabase Password Reset OTP
 */
export async function sendSupabasePasswordReset(email) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase is not configured' };

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      // Fallback to signInWithOtp
      const otpRes = await supabase.auth.signInWithOtp({ email });
      if (otpRes.error) {
        console.warn('[SUPABASE AUTH] Password reset notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true, data: otpRes.data };
    }
    console.log(`[SUPABASE AUTH] Password reset email dispatched to ${email}`);
    return { success: true, data };
  } catch (err) {
    console.warn('[SUPABASE AUTH] Password reset error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Trigger Supabase Email Change OTP
 */
export async function sendSupabaseEmailChange(newEmail) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase is not configured' };

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: newEmail,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      console.warn('[SUPABASE AUTH] Email change OTP notice:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE AUTH] Email change verification dispatched to ${newEmail}`);
    return { success: true, data };
  } catch (err) {
    console.warn('[SUPABASE AUTH] Email change error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send / Resend Supabase OTP or confirmation email
 */
export async function resendSupabaseOtp(email) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase is not configured' };

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      // Fallback to signInWithOtp if resend signup fails
      const otpRes = await supabase.auth.signInWithOtp({ email });
      if (otpRes.error) {
        console.warn('[SUPABASE AUTH] Resend notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true, data: otpRes.data };
    }

    console.log(`[SUPABASE AUTH] Resent verification email to ${email}`);
    return { success: true, data };
  } catch (err) {
    console.warn('[SUPABASE AUTH] Resend exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Verify Supabase Email OTP code (handles signup, recovery, email change)
 */
export async function verifySupabaseEmailOTP(email, token, type = 'signup') {
  const supabase = getSupabaseClient();
  if (!supabase) return { valid: false, error: 'Supabase is not configured' };

  try {
    let otpType = 'signup';
    if (type === 'CHANGE_PASSWORD') otpType = 'recovery';
    if (type === 'CHANGE_EMAIL') otpType = 'email_change';

    // 1. Try with mapped type
    let result = await supabase.auth.verifyOtp({
      email,
      token,
      type: otpType
    });

    // 2. Fallback to 'email' / 'signup'
    if (result.error && otpType !== 'email') {
      result = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
    }

    if (result.error && otpType !== 'signup') {
      result = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
    }

    if (result.error) {
      return { valid: false, error: result.error.message };
    }

    return { valid: true, data: result.data };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
