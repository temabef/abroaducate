export type QuickProfile = {
  degree_level: 'undergraduate' | 'masters' | 'phd' | 'graduate';
  field_of_study: string;
  preferred_countries: string[];
  gpa_range: '<2.5' | '2.5-3.0' | '3.0-3.5' | '3.5-4.0';
  scholarship_priority: 'essential' | 'high' | 'moderate' | 'low';
};

const LOCAL_KEY = 'abroaducate_quick_profile_v1';

export function loadQuickProfileFromLocal(): QuickProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveQuickProfileToLocal(profile: QuickProfile): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch {}
}

export async function loadQuickProfile(supabase: any, session: any): Promise<{ profile: QuickProfile | null; source: 'remote' | 'local' | 'none' }>{
  try {
    if (session?.user?.id && supabase) {
      const { data, error } = await supabase
        .from('user_quick_profile')
        .select('degree_level, field_of_study, preferred_countries, gpa_range, scholarship_priority')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!error && data) {
        return { profile: data as QuickProfile, source: 'remote' };
      }
    }
  } catch {
    // fall back to local
  }
  const local = loadQuickProfileFromLocal();
  if (local) return { profile: local, source: 'local' };
  return { profile: null, source: 'none' };
}

export async function saveQuickProfile(supabase: any, session: any, profile: QuickProfile): Promise<'remote' | 'local'> {
  try {
    if (session?.user?.id && supabase) {
      const { error } = await supabase
        .from('user_quick_profile')
        .upsert({
          user_id: session.user.id,
          degree_level: profile.degree_level,
          field_of_study: profile.field_of_study,
          preferred_countries: profile.preferred_countries,
          gpa_range: profile.gpa_range,
          scholarship_priority: profile.scholarship_priority
        }, { onConflict: 'user_id' });
      if (!error) return 'remote';
    }
  } catch {
    // ignore and fallback
  }
  saveQuickProfileToLocal(profile);
  return 'local';
}

export function gpaMidpoint(gpaRange: QuickProfile['gpa_range']): number {
  switch (gpaRange) {
    case '<2.5': return 2.25;
    case '2.5-3.0': return 2.75;
    case '3.0-3.5': return 3.25;
    case '3.5-4.0': return 3.75;
    default: return 3.0;
  }
}

