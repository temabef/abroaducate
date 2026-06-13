import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('MISSING_SUPABASE_ENV', { url: !!url, key: !!key });
  process.exit(1);
}
const supabase = createClient(url, key);

const { data: programs, error } = await supabase
  .from('programs')
  .select('id, program_name, university_name, country, tuition_tier, tuition_per_semester')
  .ilike('university_name', '%vilnius%')
  .ilike('program_name', '%dent%');

if (error) {
  console.error('ERROR_FETCHING_PROGRAMS', error);
  process.exit(1);
}

if (!programs || programs.length === 0) {
  console.log('NO_PROGRAMS_FOUND');
  process.exit(0);
}

for (const p of programs) {
  const { data: matches, count, error: mErr } = await supabase
    .from('program_scholarship_matches')
    .select('*', { count: 'exact', head: false })
    .eq('program_id', p.id);
  if (mErr) {
    console.error('ERROR_FETCH_MATCHES', p.id, mErr);
    continue;
  }
  console.log({
    id: p.id,
    program_name: p.program_name,
    university_name: p.university_name,
    country: p.country,
    tuition_tier: p.tuition_tier,
    tuition_per_semester: p.tuition_per_semester,
    matches_count: (matches || []).length
  });
}
process.exit(0);
