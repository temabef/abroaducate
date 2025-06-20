import type { SupabaseClient } from '@supabase/supabase-js';

interface CreateApplicationParams {
  supabase: SupabaseClient;
  userId: string;
  sopId: string;
  universityName: string;
  programName: string;
  applicationDeadline?: string | null;
}

export async function createApplicationFromSOP({
  supabase,
  userId,
  sopId,
  universityName,
  programName,
  applicationDeadline
}: CreateApplicationParams) {
  try {
    // Check if application already exists for this SOP
    const { data: existingApp, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('sop_id', sopId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing application:', checkError);
      return { success: false, error: checkError };
    }

    // If application already exists, return early
    if (existingApp) {
      console.log('Application already exists for SOP:', sopId);
      return { success: true, application: existingApp, isExisting: true };
    }

    // Create simple requirements checklist
    const defaultRequirements = {
      sop: { 
        completed: true, 
        document_id: sopId,
        label: 'Statement of Purpose',
        required: true
      },
      transcripts: { 
        completed: false,
        label: 'Official Transcripts',
        required: true
      },
      letters_of_recommendation: { 
        completed: false,
        count: 0,
        required_count: 3,
        label: 'Letters of Recommendation',
        required: true
      },
      cv_resume: { 
        completed: false,
        label: 'CV/Resume',
        required: true
      },
      application_form: { 
        completed: false,
        label: 'Application Form',
        required: true
      },
      application_fee: { 
        completed: false,
        label: 'Application Fee Payment',
        required: true
      }
    };

    // Create the application entry (without notes column)
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        sop_id: sopId,
        university_name: universityName,
        program_name: programName,
        application_deadline: applicationDeadline,
        requirements_checklist: defaultRequirements,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      return { success: false, error: insertError };
    }

    console.log('✅ Auto-created application for SOP:', sopId, '→ Application:', application.id);
    return { success: true, application, isExisting: false };

  } catch (error) {
    console.error('Error in createApplicationFromSOP:', error);
    return { success: false, error };
  }
}

export function calculateApplicationProgress(requirementsChecklist: any): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!requirementsChecklist || typeof requirementsChecklist !== 'object') {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const requirements = Object.values(requirementsChecklist);
  const total = requirements.length;
  
  const completed = requirements.filter((req: any) => {
    if (req.required_count) {
      // For LORs with count requirements
      return req.count >= req.required_count;
    }
    return req.completed === true;
  }).length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
} 