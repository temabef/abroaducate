import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserProgramInteraction {
  id: string;
  user_id: string;
  program_id: string;
  status: 'saved' | 'strategy' | 'ready' | 'submitted';
  match_score?: number;
  workspace_data?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all tracked programs for a specific user.
 */
export async function getTrackedPrograms(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProgramInteraction[]> {
  const { data, error } = await supabase
    .from('user_program_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching tracked programs:', error);
    return [];
  }

  return data as UserProgramInteraction[];
}

/**
 * Toggle saving a program or updating its Kanban status
 */
export async function setProgramStatus(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  status: 'saved' | 'strategy' | 'ready' | 'submitted',
  matchScore?: number,
  workspaceData?: any
): Promise<boolean> {
  try {
    const payload: Partial<UserProgramInteraction> = {
      user_id: userId,
      program_id: programId,
      status,
      // Only attach match score if provided so it doesn't overwrite with null
      ...(matchScore !== undefined && { match_score: matchScore }),
      ...(workspaceData !== undefined && { workspace_data: workspaceData })
    };

    const { error } = await supabase
      .from('user_program_interactions')
      .upsert(payload, { onConflict: 'user_id,program_id' });

    if (error) {
      console.error('Error setting program status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in setProgramStatus:', err);
    return false;
  }
}

/**
 * Delete a tracked program entirely (e.g. from the Kanban board)
 */
export async function removeTrackedProgram(
    supabase: SupabaseClient,
    userId: string,
    programId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_program_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('program_id', programId);
      
    if (error) {
      console.error('Error removing tracked program:', error);
      return false;
    }
  
    return true;
  }
