/**
 * Admin Helper Utilities
 * Provides functions for checking and managing admin status
 */

import { supabase } from '$lib/supabase';

interface AdminUser {
  user_id: string;
  role: string;
  created_at: string;
  created_by: string;
  auth_users?: {
    email: string;
  };
}

interface AdminResult {
  success: boolean;
  message: string;
}

interface AdminUsersResult extends AdminResult {
  data: AdminUser[] | null;
}

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if user is an admin, false otherwise
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data || false;
  } catch (error: any) {
    console.error('Exception checking admin status:', error);
    return false;
  }
}

/**
 * Add a new admin user
 * @param {string} email - Email of the user to add as admin
 * @param {string} role - Role to assign (default: 'admin')
 * @returns {Promise<AdminResult>} Result of the operation
 */
export async function addAdminUser(email: string, role = 'admin'): Promise<AdminResult> {
  try {
    const { data, error } = await supabase.rpc('add_admin_user', { 
      admin_email: email,
      admin_role: role
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    if (data && !data.success) {
      return { success: false, message: data.message };
    }
    
    return { success: true, message: data.message || `User ${email} added as ${role}` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Remove an admin user
 * @param {string} email - Email of the admin user to remove
 * @returns {Promise<AdminResult>} Result of the operation
 */
export async function removeAdminUser(email: string): Promise<AdminResult> {
  try {
    const { data, error } = await supabase.rpc('remove_admin_user', { 
      admin_email: email 
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    if (data && !data.success) {
      return { success: false, message: data.message };
    }
    
    return { success: true, message: data.message || `User ${email} removed from admins` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Get all admin users
 * @returns {Promise<AdminUsersResult>} List of admin users
 */
export async function getAdminUsers(): Promise<AdminUsersResult> {
  try {
    const { data, error } = await supabase.rpc('get_admin_users');
    
    if (error) {
      return { success: false, data: null, message: error.message };
    }
    
    return { success: true, data, message: 'Admin users retrieved' };
  } catch (error: any) {
    return { success: false, data: null, message: error.message || 'Unknown error' };
  }
} 