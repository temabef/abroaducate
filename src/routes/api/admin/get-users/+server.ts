import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Get session user
    const session = await locals.getSession();
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await locals.supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check admin role
    if (!profile.role || !['admin', 'super-admin'].includes(profile.role)) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get users from profiles table
    const { data: users, error } = await locals.supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        updated_at,
        role
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform the data to match our expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.email.split('@')[0], // Use email prefix as name if no full_name
      created_at: user.created_at,
      updated_at: user.updated_at,
      subscription_plan: 'free', // Default since column doesn't exist
      subscription_status: 'active', // Default since column doesn't exist
      role: user.role || 'user'
    }));

    return json({ users: transformedUsers });
  } catch (error) {
    console.error('Error in get-users API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 