import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    console.log('=== DASHBOARD DEBUG INFO ===');
    console.log('User ID:', userId);
    console.log('User email:', session.user.email);

    // First, let's check if the SOPs table exists and what columns it has
    const { data: allSops, error: allSopsError } = await supabase
      .from('sops')
      .select('*')
      .limit(5);
    
    console.log('Sample SOPs in database (any user):', allSops);
    console.log('SOPs table error:', allSopsError);

    // Get SOPs with more detailed query
    const { data: sops, error: sopsError } = await supabase
      .from('sops')
      .select('id, sop_title, university_name, program_name, updated_at, word_count, status, created_at, user_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    console.log('SOPs query result:', { sops, error: sopsError });
    console.log('SOPs count:', sops?.length || 0);

    if (sopsError) console.warn('Error fetching SOPs:', sopsError);

    // Get Cover Letters
    const { data: coverLetters, error: coverLettersError } = await supabase
      .from('cover_letters')
      .select('id, job_title, company_name, updated_at, position_type, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    console.log('Cover Letters count:', coverLetters?.length || 0);
    if (coverLettersError) console.warn('Error fetching cover letters:', coverLettersError);

    // Get Personal Statements
    const { data: personalStatements, error: personalStatementsError } = await supabase
      .from('personal_statements')
      .select('id, program_name, institution_name, updated_at, application_type, word_count, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    console.log('Personal Statements count:', personalStatements?.length || 0);
    if (personalStatementsError) console.warn('Error fetching personal statements:', personalStatementsError);

    // Calculate summary statistics
    const summary = {
      total_documents: (sops?.length || 0) + (coverLetters?.length || 0) + (personalStatements?.length || 0),
      sop_count: sops?.length || 0,
      cover_letter_count: coverLetters?.length || 0,
      personal_statement_count: personalStatements?.length || 0,
      last_activity: getLastActivity([
        ...(sops?.map(s => s.updated_at) || []),
        ...(coverLetters?.map(cl => cl.updated_at) || []),
        ...(personalStatements?.map(ps => ps.updated_at) || [])
      ])
    };

    console.log('Summary statistics:', summary);

    // Generate recent activity feed
    const activity = generateRecentActivity(sops || [], coverLetters || [], personalStatements || []);

    console.log('=== END DASHBOARD DEBUG ===');

    return json({
      success: true,
      summary,
      documents: {
        sops: sops || [],
        coverLetters: coverLetters || [],
        personalStatements: personalStatements || []
      },
      activity,
      debug: {
        userId,
        userEmail: session.user.email,
        sopCount: sops?.length || 0,
        coverLetterCount: coverLetters?.length || 0,
        personalStatementCount: personalStatements?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return json({ 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

function getLastActivity(dates: string[]): string | null {
  if (dates.length === 0) return null;
  
  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  return sortedDates[0].toISOString();
}

function generateRecentActivity(
  sops: any[], 
  coverLetters: any[], 
  personalStatements: any[]
): Array<{
  document_type: string;
  document_title: string;
  last_activity: string;
  document_id: string;
  action_type: string;
}> {
  const activities: Array<{
    document_type: string;
    document_title: string;
    last_activity: string;
    document_id: string;
    action_type: string;
  }> = [];

  // Add SOP activities
  sops.forEach(sop => {
    activities.push({
      document_type: 'sop',
      document_title: sop.sop_title || 'Untitled SOP',
      last_activity: sop.updated_at,
      document_id: sop.id,
      action_type: 'edited'
    });
  });

  // Add Cover Letter activities
  coverLetters.forEach(letter => {
    activities.push({
      document_type: 'cover_letter',
      document_title: `${letter.job_title || 'Position'} - ${letter.company_name || 'Company'}`,
      last_activity: letter.updated_at,
      document_id: letter.id,
      action_type: 'edited'
    });
  });

  // Add Personal Statement activities
  personalStatements.forEach(statement => {
    activities.push({
      document_type: 'personal_statement',
      document_title: `${statement.program_name || 'Program'} - ${statement.institution_name || 'Institution'}`,
      last_activity: statement.updated_at,
      document_id: statement.id,
      action_type: 'edited'
    });
  });

  // Sort by most recent and return top 10
  return activities
    .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
    .slice(0, 10);
} 