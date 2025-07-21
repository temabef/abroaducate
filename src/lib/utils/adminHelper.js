/**
 * Admin Helper Utilities
 * Provides functions for checking and managing admin status
 */

import { supabase } from '$lib/supabase';

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if user is an admin, false otherwise
 */
export async function isUserAdmin() {
  try {
    // First try the direct admin check function
    const { data: directData, error: directError } = await supabase.rpc('is_admin_direct');
    
    if (!directError && directData) {
      return true;
    }
    
    // Fall back to the regular admin check
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
}

/**
 * Add a new admin user
 * @param {string} email - Email of the user to add as admin
 * @param {string} role - Role to assign (default: 'admin')
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function addAdminUser(email, role = 'admin') {
  try {
    const { data, error } = await supabase.rpc('add_admin_user', { 
      email_to_add: email,
      admin_role: role
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: `User ${email} added as ${role}` };
  } catch (error) {
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Remove an admin user
 * @param {string} email - Email of the admin user to remove
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function removeAdminUser(email) {
  try {
    const { data, error } = await supabase.rpc('remove_admin_user', { 
      email_to_remove: email 
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: `User ${email} removed from admins` };
  } catch (error) {
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Get all admin users
 * @returns {Promise<{success: boolean, data: Array, message: string}>} List of admin users
 */
export async function getAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        user_id,
        role,
        created_at,
        created_by,
        auth_users:user_id(email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { success: false, data: null, message: error.message };
    }
    
    return { success: true, data, message: 'Admin users retrieved' };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Unknown error' };
  }
} 