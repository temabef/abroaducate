import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    console.log('=== ADMIN DEBUG INFO ===');
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);

    // Test 1: Check if user is in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id, role, email_cache')
      .eq('user_id', session.user.id)
      .single();

    console.log('Admin user record:', adminUser);
    console.log('Admin query error:', adminError);

    // Test 2: Test the can_manage_scholarships function
    const { data: canManageResult, error: functionError } = await supabase
      .rpc('can_manage_scholarships');

    console.log('Can manage scholarships result:', canManageResult);
    console.log('Function error:', functionError);

    // Test 3: Test the debug function if it exists
    let debugResult = null;
    let debugError = null;
    try {
      const { data: debugData, error: debugErr } = await supabase
        .rpc('debug_admin_status');
      debugResult = debugData;
      debugError = debugErr;
    } catch (err) {
      debugError = err;
    }

    console.log('Debug function result:', debugResult);
    console.log('Debug function error:', debugError);

    // Test 4: Try to read from scholarships table
    const { data: scholarships, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('id, title')
      .limit(5);

    console.log('Scholarship read test:', { count: scholarships?.length || 0, error: scholarshipError });

    // Test 5: Try to insert a test scholarship (we'll immediately delete it)
    let insertTest = null;
    let insertError = null;
    try {
      const testScholarship = {
        title: 'DEBUG_TEST_SCHOLARSHIP',
        provider: 'Test Provider',
        amount: '$1000',
        deadline: '2025-12-31',
        location: 'Test Location',
        field: 'Test Field',
        level: 'Test Level',
        type: 'Test Type',
        description: 'This is a test scholarship for debugging',
        requirements: ['Test requirement'],
        is_active: false // Keep it inactive
      };

      const { data: insertData, error: insertErr } = await supabase
        .from('scholarships')
        .insert(testScholarship)
        .select()
        .single();

      if (insertData && !insertErr) {
        // Immediately delete the test scholarship
        await supabase
          .from('scholarships')
          .delete()
          .eq('id', insertData.id);
        
        insertTest = { success: true, message: 'Insert test passed' };
      } else {
        insertError = insertErr;
      }
    } catch (err) {
      insertError = err;
    }

    const response = {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      admin_status: {
        is_in_admin_table: !!adminUser,
        admin_role: adminUser?.role || null,
        admin_error: adminError
      },
      permissions: {
        can_manage_scholarships: canManageResult,
        function_error: functionError
      },
      debug_function: {
        result: debugResult,
        error: debugError
      },
      tests: {
        scholarship_read: {
          success: !scholarshipError,
          count: scholarships?.length || 0,
          error: scholarshipError
        },
        scholarship_insert: {
          success: !!insertTest,
          result: insertTest,
          error: insertError
        }
      }
    };

    console.log('=== FINAL DEBUG RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
    
    return json(response);

  } catch (error) {
    console.error('Debug API error:', error);
    return json({
      success: false,
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 