import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

/**
 * POST handler for adding a user as an admin
 */
export async function POST({ request, locals }) {
  try {
    // Get the current user from SvelteKit session
    const session = await locals.getSession();
    const user = session?.user;
    
    if (!session || !user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('Current user from session:', user);
    
    // Get request body
    const { email, role } = await request.json();
    
    if (!email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    // First try to find the user by email using direct SQL
    // This bypasses RLS since we're using the admin_bypass_find_user function
    const { data: targetUser, error: targetUserError } = await supabase.rpc('admin_bypass_find_user', { 
      email_to_find: email 
    });
    
    if (targetUserError) {
      console.error('Error finding user:', targetUserError);
      return json({ success: false, error: `Error finding user: ${targetUserError.message}` }, { status: 500 });
    }
    
    if (!targetUser || !targetUser.id) {
      return json({ success: false, error: `User with email ${email} not found` }, { status: 404 });
    }
    
    console.log('Found target user:', targetUser);
    
    // Add the user as admin directly
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        user_id: targetUser.id,
        role: role || 'admin',
        created_by: user.id
      });
    
    if (insertError) {
      console.error('Error adding admin:', insertError);
      return json({ success: false, error: `Error adding admin: ${insertError.message}` }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (e) {
    console.error('Exception adding admin:', e);
    return json({ success: false, error: e.message }, { status: 500 });
  }
} 