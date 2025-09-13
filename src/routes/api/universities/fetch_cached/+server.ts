import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { universityDataManager } from '$lib/database/university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';

// Cache-on-read endpoint for US universities
export const GET: RequestHandler = async ({ url, locals }) => {
  const { supabase } = locals;
  try {
    const state = url.searchParams.get('state') || undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const type = url.searchParams.get('type') || 'all'; // 'all' | 'top'
    const force = url.searchParams.get('force') === 'true' || url.searchParams.get('forceRefresh') === 'true';
    const ttlHours = Math.max(1, Math.min(168, parseInt(url.searchParams.get('ttl') || '24'))); // 1..168h
    const searchName = url.searchParams.get('name'); // NEW: Search by university name

    // Attempt cache first (if not forced)
    if (!force && supabase) {
      const sinceIso = new Date(Date.now() - ttlHours * 3600_000).toISOString();
      let query = supabase
        .from('us_universities_normalized')
        .select('*')
        .gte('last_updated', sinceIso)
        .order('last_updated', { ascending: false })
        .limit(limit);

      if (state) query = query.eq('state', state);

      const { data: cached, error } = await query;
      if (!error && cached && cached.length > 0) {
        const universities = cached.map((r: any) => ({
          id: r.id,
          name: r.name,
          country: r.country,
          state: r.state,
          city: r.city,
          region: r.region,
          acceptance_rate: r.acceptance_rate ?? undefined,
          avg_gpa: r.avg_gpa ?? undefined,
          avg_sat: r.avg_sat ?? undefined,
          cost: r.cost,
          living_cost: r.living_cost ?? undefined,
          in_state_tuition: r.in_state_tuition ?? undefined,
          out_of_state_tuition: r.out_of_state_tuition ?? undefined,
          scholarships: !!r.scholarships,
          scholarship_percentage: r.scholarship_percentage ?? undefined,
          median_debt: r.median_debt ?? undefined,
          graduate_earnings: r.graduate_earnings ?? undefined,
          location_type: r.location_type,
          class_size: r.class_size,
          research_opportunities: r.research_opportunities,
          student_size: r.student_size ?? undefined,
          ownership_type: r.ownership_type ?? undefined,
          website_url: r.website_url ?? undefined,
          data_source: (r.data_source || 'college_scorecard') as 'college_scorecard',
          strengths: r.strengths || [],
          programs: r.programs || {},
          requirements: r.requirements || {},
          last_updated: r.last_updated
        }));
        
        // Apply name filter if provided
        if (searchName && searchName.trim() !== '') {
          const searchTerm = searchName.toLowerCase().trim();
          universities = universities.filter(uni => 
            uni.name.toLowerCase().includes(searchTerm)
          );
        }
        
        return json({ success: true, cached: true, count: universities.length, universities });
      }
    }

    // Fetch live and upsert (cache-on-read)
    const universities = type === 'top'
      ? await universityDataManager.fetchTopUSUniversities(limit, COLLEGE_SCORECARD_API_KEY)
      : await universityDataManager.fetchUSUniversities(state, limit, COLLEGE_SCORECARD_API_KEY);

    // Upsert into cache table in background (best-effort)
    try {
      if (supabase && universities.length > 0) {
        const payload = universities.map(u => ({
          id: u.id,
          name: u.name,
          country: u.country,
          state: u.state,
          city: u.city,
          region: u.region,
          acceptance_rate: u.acceptance_rate ?? null,
          avg_gpa: u.avg_gpa ?? null,
          avg_sat: u.avg_sat ?? null,
          cost: u.cost,
          living_cost: u.living_cost ?? null,
          in_state_tuition: u.in_state_tuition ?? null,
          out_of_state_tuition: u.out_of_state_tuition ?? null,
          scholarships: u.scholarships,
          scholarship_percentage: u.scholarship_percentage ?? null,
          median_debt: u.median_debt ?? null,
          graduate_earnings: u.graduate_earnings ?? null,
          location_type: u.location_type,
          class_size: u.class_size,
          research_opportunities: u.research_opportunities,
          student_size: u.student_size ?? null,
          ownership_type: u.ownership_type ?? null,
          website_url: u.website_url ?? null,
          data_source: u.data_source,
          strengths: u.strengths,
          programs: u.programs,
          requirements: u.requirements,
          last_updated: new Date().toISOString()
        }));
        await supabase.from('us_universities_normalized').upsert(payload, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('Cache upsert failed (non-fatal):', e);
    }

    // Apply name filter if provided
    let filteredUniversities = universities;
    if (searchName && searchName.trim() !== '') {
      const searchTerm = searchName.toLowerCase().trim();
      filteredUniversities = universities.filter(uni => 
        uni.name.toLowerCase().includes(searchTerm)
      );
    }

    return json({ success: true, cached: false, count: filteredUniversities.length, universities: filteredUniversities });
  } catch (e) {
    console.error('fetch_cached error:', e);
    return json({ success: false, error: 'Failed to fetch universities' }, { status: 500 });
  }
};
