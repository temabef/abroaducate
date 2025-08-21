import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ url }) => {
  try {
    const state = url.searchParams.get('state');
    const popular = url.searchParams.get('popular') === 'true';
    
    let query = supabase
      .from('us_cities_cost_data')
      .select('*')
      .order('cost_of_living_index', { ascending: true });
    
    if (state) {
      query = query.eq('state', state);
    }
    
    if (popular) {
      query = query.not('popular_universities', 'is', null)
              .limit(12);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching cities:', error);
      return json({ error: 'Failed to fetch cities data' }, { status: 500 });
    }
    
    return json({
      success: true,
      cities: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Error in cities endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
