import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase config');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const today = new Date().toISOString().slice(0, 10);
import { writeFileSync } from 'node:fs';
const { data, error } = await supabase
  .from('programs')
  .select('id, program_name, university_name, country, city, degree_level, language_of_instruction, tuition_per_semester, tuition_currency, tuition_label, semester_fee, application_fee, direct_application_url, official_source_url, application_close_date, program_duration_months, deadline_summary, tuition_tier')
  .eq('is_active', true)
  .eq('tuition_label', 'free')
  .neq('direct_application_url', null)
  .gte('application_close_date', today)
  .order('application_close_date', { ascending: true })
  .limit(50);

if (error) {
  console.error('Error:', error.message || error);
  process.exit(1);
}
writeFileSync('query_results.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Wrote query_results.json with ' + data.length + ' rows');
