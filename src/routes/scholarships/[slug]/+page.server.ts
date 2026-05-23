import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { getSession, supabase, supabaseServiceRole } }) => {
  // Get the current session
  const session = await getSession();
  
  // Get the scholarship ID from the URL parameter
  const scholarshipId = params.slug;
  
  // Fetch the scholarship data using the decoded public view to ensure characters render correctly
  const { data: scholarship, error: scholarshipError } = await supabase
    .from('public_scholarships_decoded')
    .select('*')
    .eq('id', scholarshipId)
    .single();
  
  // If there's an error or no data, throw a 404
  if (scholarshipError || !scholarship) {
    console.error("Error loading scholarship:", scholarshipError);
    throw error(404, { message: 'Scholarship not found' });
  }
  
  // Fetch user interaction if logged in
  let savedStatus = false;
  if (session?.user?.id) {
    const { data: interaction } = await supabase
      .from('user_scholarship_interactions')
      .select('is_saved')
      .eq('user_id', session.user.id)
      .eq('scholarship_id', scholarshipId)
      .maybeSingle();
      
    savedStatus = interaction?.is_saved || false;
  }
  
  // Fetch related scholarships (same field and level)
  let relatedScholarships = [];
  try {
    const { data: relatedData } = await supabase
      .from('public_scholarships_decoded')
      .select('*')
      .or(`field.eq.${scholarship.field},field.eq.All Fields`)
      .eq('level', scholarship.level)
      .limit(3);
    relatedScholarships = relatedData || [];
  } catch (err) {
    console.error("Error fetching related scholarships:", err);
    // Continue even if related scholarships fail
  }
  
  // Check for user-specific cached strategy in workspace_data
  let userStrategy: any = null;
  if (session?.user?.id) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('workspace_data')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    userStrategy = userProfile?.workspace_data?.scholarship_strategies?.[scholarshipId] || null;
  }

  // Fetch user's generated documents for strategy context
  let userDocuments: any[] = [];
  if (session?.user?.id) {
    try {
      const [sopsRes, clRes, psRes, cvRes] = await Promise.all([
        supabase.from('sops').select('id, university_name, program_name, status, word_count, updated_at', { count: 'exact' }).eq('user_id', session.user.id).order('updated_at', { ascending: false }),
        supabase.from('cover_letters').select('id, university_name, program_name, status, word_count, updated_at', { count: 'exact' }).eq('user_id', session.user.id).order('updated_at', { ascending: false }),
        supabase.from('personal_statements').select('id, university_name, program_name, status, word_count, updated_at', { count: 'exact' }).eq('user_id', session.user.id).order('updated_at', { ascending: false }),
        supabase.from('academic_cvs').select('id, university_name, program_name, status, word_count, updated_at').eq('user_id', session.user.id).order('updated_at', { ascending: false })
      ]);
      userDocuments = [
        ...(sopsRes.data || []).map((s: any) => ({ ...s, type: 'sop', typeName: 'Statement of Purpose', icon: '📝' })),
        ...(clRes.data || []).map((c: any) => ({ ...c, type: 'cover-letter', typeName: 'Cover Letter', icon: '📄' })),
        ...(psRes.data || []).map((p: any) => ({ ...p, type: 'personal-statement', typeName: 'Personal Statement', icon: '✍️' })),
        ...(cvRes.data || []).map((v: any) => ({ ...v, type: 'academic-cv', typeName: 'Academic CV', icon: '🎓' }))
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } catch (err) {
      console.error("Error fetching user documents:", err);
    }
  }

  // Return serializable data
  return {
    session,
    scholarship,
    savedStatus,
    relatedScholarships,
    userStrategy,
    userDocuments,
    winStrategy: (async () => {
      // Only return stored AI win strategy to paid users.
      if (!session?.user?.id) return null;

      const { data: subscription } = await supabaseServiceRole
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const planType = subscription?.plan_type || 'free';
      if (planType === 'free') return null;

      const { data: row } = await supabaseServiceRole
        .from('scholarship_win_strategies')
        .select('strategy, updated_at, model, version')
        .eq('scholarship_id', scholarshipId)
        .maybeSingle();

      return row?.strategy || null;
    })()
  };
}; 