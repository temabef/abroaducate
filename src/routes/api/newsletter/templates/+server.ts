import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Check admin authorization
async function checkAdminAccess(supabaseClient: any): Promise<boolean> {
  try {
    const { data: canManageContent, error } = await supabaseClient.rpc('can_manage_content');
    
    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
    
    return !!canManageContent;
  } catch (error) {
    console.error('Error in admin access check:', error);
    return false;
  }
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('📧 Loading email templates...');

    // Get all active email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_category', { ascending: true })
      .order('template_name', { ascending: true });

    if (templatesError) {
      console.error('Error loading templates:', templatesError);
      return json({ error: 'Failed to load templates' }, { status: 500 });
    }

    console.log(`✅ Loaded ${templates?.length || 0} templates`);

    return json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0
    });

  } catch (error) {
    console.error('Error in templates endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 