import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  try {
    const { diagnostic_data, results, session_id } = await request.json();
    
    if (!diagnostic_data || !results) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }
    
    // Try to save diagnostic results to database
    // Store everything in JSONB format for flexibility
    const { data, error } = await supabase
      .from('diagnostic_results')
      .insert({
        session_id: session_id || crypto.randomUUID(),
        // Store all diagnostic data in a JSONB field
        diagnostic_data: {
          currentCountry: diagnostic_data.currentCountry,
          gpaValue: diagnostic_data.gpaValue,
          gpaScale: diagnostic_data.gpaScale,
          englishTest: diagnostic_data.englishTest,
          englishScore: diagnostic_data.englishScore,
          budget: diagnostic_data.budget,
          targetCountries: diagnostic_data.targetCountries,
          fieldOfStudy: diagnostic_data.fieldOfStudy,
          degreeLevel: diagnostic_data.degreeLevel,
          // Pathway data
          currentEducationLevel: diagnostic_data.currentEducationLevel,
          pathwayPreference: diagnostic_data.pathwayPreference,
          hasMastersTranscript: diagnostic_data.hasMastersTranscript
        },
        assessment_results: {
          overall_score: results.overallScore,
          competitive_count: results.competitive.length,
          needs_work_count: results.needsWork.length,
          unrealistic_count: results.unrealistic.length,
          competitive_countries: results.competitive.map((c: any) => c.country),
          needs_work_countries: results.needsWork.map((c: any) => c.country),
          unrealistic_countries: results.unrealistic.map((c: any) => c.country),
          pathway: results.pathway
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      // Log error but don't fail the request - results are already in sessionStorage
      console.warn('Could not save diagnostic results to database (non-critical):', error.message);
      // Return success anyway - the user can still see their results
      return json({ 
        success: true, 
        warning: 'Results saved locally but not to database',
        error: error.message 
      });
    }
    
    return json({ success: true, id: data?.id });
    
  } catch (error: any) {
    // Don't fail the request - results are in sessionStorage
    console.warn('Exception saving diagnostic results (non-critical):', error);
    return json({ 
      success: true, 
      warning: 'Results saved locally',
      error: error.message 
    });
  }
};
