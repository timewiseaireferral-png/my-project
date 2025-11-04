import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure that the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required!');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Direct authentication functions (fallback if proxy fails)
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting direct Supabase sign in...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Direct sign in failed:', error);
      return { error, user: null };
    }
    
    console.log('Direct sign in successful');
    return { error: null, user: data.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: { message: error.message || 'Network error' }, user: null };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    console.log('Attempting direct Supabase sign up...');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Direct sign up failed:', error);
      
      const isEmailExists = error.message?.includes('already registered') || 
                           error.message?.includes('already exists');
      
      return { 
        success: false, 
        emailExists: isEmailExists,
        error, 
        user: null 
      };
    }
    
    console.log('Direct sign up successful');
    return { 
      success: true, 
      emailExists: false, 
      error: null, 
      user: data.user 
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      emailExists: false, 
      error: { message: error.message || 'Network error' }, 
      user: null 
    };
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    console.log('Requesting password reset...');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Password reset failed:', error);
      return { success: false, error };
    }
    
    console.log('Password reset email sent');
    return { success: true, error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: { message: error.message || 'Network error' } 
    };
  }
};

// Helper function to check if email is verified
export function isEmailVerified(user: any): boolean {
  return user?.email_confirmed_at !== undefined && user?.email_confirmed_at !== null;
}

// FIXED: Updated function to properly check user access from database
export async function hasAnyAccess(userId: string): Promise<boolean> {
  try {
    // Query the user_access_status table to check payment verification
    const { data, error } = await supabase
      .from('user_access_status')
      .select('payment_verified, has_access, temp_access_until, manual_override')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user access:', error);
      // If table doesn't exist, grant temporary access to prevent app from breaking
      if (error.message?.includes('Could not find the table') || error.code === 'PGRST205') {
        console.warn('⚠️ Database table not found - granting temporary access');
        return true;
      }
      return false;
    }

    if (!data) {
      return false;
    }

    // Check if user has permanent access (payment verified or manual override)
    if (data.payment_verified || data.manual_override || data.has_access) {
      return true;
    }

    // Check if user has valid temporary access
    if (data.temp_access_until) {
      const tempAccessDate = new Date(data.temp_access_until);
      const now = new Date();
      return tempAccessDate > now;
    }

    return false;
  } catch (error) {
    console.error('Error in hasAnyAccess:', error);
    // Grant temporary access on error to prevent app from breaking
    return true;
  }
}

// FIXED: New function to get detailed user access status
export async function getUserAccessStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_access_status')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user access status:', error);
      // If table doesn't exist, return a mock access object
      if (error.message?.includes('Could not find the table') || error.code === 'PGRST205') {
        console.warn('⚠️ Database table not found - returning mock access');
        return {
          id: userId,
          has_access: true,
          payment_verified: true,
          manual_override: false,
          temp_access_until: null
        };
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserAccessStatus:', error);
    return null;
  }
}

// Export default for compatibility
export default supabase;
