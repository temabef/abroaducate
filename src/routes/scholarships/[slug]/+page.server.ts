import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { getSession, supabase } }) => {
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
  
  // Return serializable data
  return {
    session,
    scholarship,
    savedStatus,
    relatedScholarships
  };
}; 