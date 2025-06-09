import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, Scholarship } from './scholarshipMatching';
import { calculateScholarshipMatch } from './scholarshipMatching';

export interface ScholarshipWithInteraction extends Scholarship {
  is_saved?: boolean;
  is_applied?: boolean;
  match_score?: number;
  applied_at?: string;
}

export interface UserScholarshipInteraction {
  id: string;
  user_id: string;
  scholarship_id: string;
  is_saved: boolean;
  is_applied: boolean;
  match_score?: number;
  applied_at?: string;
}

/**
 * Get all active scholarships with user interactions
 */
export async function getScholarshipsWithInteractions(
  supabase: SupabaseClient,
  userId?: string
): Promise<ScholarshipWithInteraction[]> {
  const { data: scholarships, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scholarships:', error);
    return [];
  }

  if (!userId) {
    return scholarships;
  }

  // Get user interactions
  const { data: interactions } = await supabase
    .from('user_scholarship_interactions')
    .select('*')
    .eq('user_id', userId);

  // Get user profile for match calculation
  const userProfile = await getUserProfile(supabase, userId);

  // Merge scholarships with interactions and calculate match scores
  return scholarships.map(scholarship => {
    const interaction = interactions?.find(i => i.scholarship_id === scholarship.id);
    const matchScore = userProfile 
      ? calculateScholarshipMatch(userProfile, scholarship)
      : undefined;

    return {
      ...scholarship,
      is_saved: interaction?.is_saved || false,
      is_applied: interaction?.is_applied || false,
      match_score: interaction?.match_score || matchScore,
      applied_at: interaction?.applied_at
    };
  });
}

/**
 * Get user profile
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null;
    }
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: Partial<UserProfile>
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      ...profile
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  return data;
}

/**
 * Save/unsave a scholarship
 */
export async function toggleScholarshipSaved(
  supabase: SupabaseClient,
  userId: string,
  scholarshipId: string,
  userProfile?: UserProfile
): Promise<boolean> {
  // Get current interaction
  const { data: existingInteraction } = await supabase
    .from('user_scholarship_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId)
    .single();

  const isCurrentlySaved = existingInteraction?.is_saved || false;
  
  // Get scholarship for match calculation
  let matchScore = existingInteraction?.match_score;
  if (!matchScore && userProfile) {
    const { data: scholarship } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();
    
    if (scholarship) {
      matchScore = calculateScholarshipMatch(userProfile, scholarship);
    }
  }

  const { error } = await supabase
    .from('user_scholarship_interactions')
    .upsert({
      user_id: userId,
      scholarship_id: scholarshipId,
      is_saved: !isCurrentlySaved,
      is_applied: existingInteraction?.is_applied || false,
      match_score: matchScore
    });

  if (error) {
    console.error('Error toggling scholarship saved:', error);
    return false;
  }

  return true;
}

/**
 * Apply to a scholarship
 */
export async function applyToScholarship(
  supabase: SupabaseClient,
  userId: string,
  scholarshipId: string,
  userProfile?: UserProfile
): Promise<boolean> {
  // Get current interaction
  const { data: existingInteraction } = await supabase
    .from('user_scholarship_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId)
    .single();

  // Calculate match score if not exists
  let matchScore = existingInteraction?.match_score;
  if (!matchScore && userProfile) {
    const { data: scholarship } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();
    
    if (scholarship) {
      matchScore = calculateScholarshipMatch(userProfile, scholarship);
    }
  }

  const { error } = await supabase
    .from('user_scholarship_interactions')
    .upsert({
      user_id: userId,
      scholarship_id: scholarshipId,
      is_saved: true, // Auto-save when applying
      is_applied: true,
      applied_at: new Date().toISOString(),
      match_score: matchScore
    });

  if (error) {
    console.error('Error applying to scholarship:', error);
    return false;
  }

  return true;
}

/**
 * Get user's scholarship interactions summary
 */
export async function getScholarshipStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  total_available: number;
  saved_count: number;
  applied_count: number;
  high_match_count: number;
}> {
  // Get total scholarships
  const { count: totalCount } = await supabase
    .from('scholarships')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get user interactions
  const { data: interactions } = await supabase
    .from('user_scholarship_interactions')
    .select('is_saved, is_applied, match_score')
    .eq('user_id', userId);

  const savedCount = interactions?.filter(i => i.is_saved).length || 0;
  const appliedCount = interactions?.filter(i => i.is_applied).length || 0;
  const highMatchCount = interactions?.filter(i => (i.match_score || 0) >= 80).length || 0;

  return {
    total_available: totalCount || 0,
    saved_count: savedCount,
    applied_count: appliedCount,
    high_match_count: highMatchCount
  };
}

/**
 * Search and filter scholarships
 */
export async function searchScholarships(
  supabase: SupabaseClient,
  userId: string | undefined,
  filters: {
    search?: string;
    location?: string;
    level?: string;
    type?: string;
    field?: string;
  }
): Promise<ScholarshipWithInteraction[]> {
  let query = supabase
    .from('scholarships')
    .select('*')
    .eq('is_active', true);

  // Apply filters
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  
  if (filters.level) {
    query = query.ilike('level', `%${filters.level}%`);
  }
  
  if (filters.type) {
    query = query.ilike('type', `%${filters.type}%`);
  }
  
  if (filters.field) {
    query = query.ilike('field', `%${filters.field}%`);
  }

  const { data: scholarships, error } = await query;

  if (error) {
    console.error('Error searching scholarships:', error);
    return [];
  }

  let filteredScholarships = scholarships || [];

  // Apply text search
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredScholarships = filteredScholarships.filter(scholarship =>
      scholarship.title.toLowerCase().includes(searchTerm) ||
      scholarship.provider.toLowerCase().includes(searchTerm) ||
      scholarship.field.toLowerCase().includes(searchTerm) ||
      scholarship.location.toLowerCase().includes(searchTerm) ||
      scholarship.description.toLowerCase().includes(searchTerm)
    );
  }

  if (!userId) {
    return filteredScholarships;
  }

  // Get user interactions
  const { data: interactions } = await supabase
    .from('user_scholarship_interactions')
    .select('*')
    .eq('user_id', userId);

  // Get user profile for match calculation
  const userProfile = await getUserProfile(supabase, userId);

  // Merge with interactions and calculate match scores
  return filteredScholarships.map(scholarship => {
    const interaction = interactions?.find(i => i.scholarship_id === scholarship.id);
    const matchScore = userProfile 
      ? calculateScholarshipMatch(userProfile, scholarship)
      : undefined;

    return {
      ...scholarship,
      is_saved: interaction?.is_saved || false,
      is_applied: interaction?.is_applied || false,
      match_score: interaction?.match_score || matchScore,
      applied_at: interaction?.applied_at
    };
  });
} 