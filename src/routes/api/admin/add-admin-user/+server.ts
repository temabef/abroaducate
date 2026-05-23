import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { z } from 'zod';

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
    
    // Define schema for validation
    const addAdminSchema = z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'super-admin', 'scholarship-admin']).default('admin')
    });
    
    // Get request body
    const requestData = await request.json();
    
    // Validate and sanitize input
    const parsed = addAdminSchema.safeParse(requestData);
    if (!parsed.success) {
      return json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    
    if (!data.email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    // Use the add_admin_user function which handles all the logic
    const { data: addResult, error: addError } = await supabase.rpc('add_admin_user', {
      admin_email: data.email.trim(),
      admin_role: data.role || 'admin'
    });
    
    if (addError) {
      console.error('Error adding admin:', addError);
      return json({ success: false, error: `Error adding admin: ${addError.message}` }, { status: 500 });
    }
    
    // Parse the result from the function
    const result: any = typeof addResult === 'string' ? JSON.parse(addResult) : addResult;
    
    if (!result.success) {
      return json({ success: false, error: result.message }, { status: 400 });
    }
    
    return json({ success: true, message: result.message });
  } catch (e: any) {
    console.error('Exception adding admin:', e);
    return json({ success: false, error: e.message }, { status: 500 });
  }
} 
