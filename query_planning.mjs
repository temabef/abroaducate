import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase config');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const today = new Date().toISOString().slice(0, 10);
const keywords = [
  'urban',
  'planning',
  'gis',
  'geography',
  'spatial',
  'smart city',
  'smart cities',
  'transport',
  'mobility',
  'environmental planning'
];
const orFilters = keywords
  .map((word) => `program_name.ilike.%${word}%`)
  .concat(keywords.map((word) => `field_of_study.ilike.%${word}%`))
  .join(',');

const { data, error } = await supabase
  .from('programs')
  .select('id, program_name, university_name, country, city, degree_level, language_of_instruction, tuition_per_semester, tuition_currency, tuition_label, semester_fee, application_fee, direct_application_url, official_source_url, application_close_date, deadline_summary, tuition_tier, field_of_study')
  .eq('is_active', true)
  .neq('direct_application_url', null)
  .gte('application_close_date', today)
  .or(orFilters)
  .order('application_close_date', { ascending: true })
  .limit(50);

if (error) {
  console.error('Error:', error.message || error);
  process.exit(1);
}
writeFileSync('query_planning.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Wrote query_planning.json with ' + (data?.length ?? 0) + ' rows');
