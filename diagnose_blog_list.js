import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Use ANON key to replicate what the browser/SSR sees (not service role)
const ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const now = new Date().toISOString();

async function runBlogListQuery(client, label) {
  console.log(`\n--- Running with ${label} ---`);
  console.log(`Now = ${now}`);
  
  const { data: posts, error, count } = await client
    .from('blog_posts')
    .select('id, title, slug, status, published_at, created_at', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .range(0, 9);

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`Total matching posts: ${count}`);
  const our = posts?.find(p => p.slug === 'program-or-scholarship-first');
  if (our) {
    console.log(`✅ Our post IS in the result!`);
    console.log(`   Rank #${posts.indexOf(our) + 1} of ${posts.length}`);
    console.log(`   published_at: ${our.published_at}`);
    console.log(`   created_at:   ${our.created_at}`);
  } else {
    console.log(`❌ Our post is NOT in the first page of results.`);
    console.log(`\nTop 3 posts returned:`);
    posts?.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title?.substring(0, 60)} | pub: ${p.published_at} | cre: ${p.created_at}`);
    });
  }
}

async function checkRLS() {
  console.log(`\n--- Checking RLS policies ---`);
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id, slug, status')
    .eq('slug', 'program-or-scholarship-first')
    .single();
  
  if (error) {
    console.log(`Admin query error: ${error.message}`);
  } else {
    console.log(`Admin can see post: slug=${data.slug}, status=${data.status}`);
  }

  // Now try with anon key
  const { data: anonData, error: anonErr } = await supabaseAnon
    .from('blog_posts')
    .select('id, slug, status')
    .eq('slug', 'program-or-scholarship-first')
    .single();
  
  if (anonErr) {
    console.log(`⚠️  Anon cannot see post: ${anonErr.message}`);
    console.log(`   This means there is an RLS policy blocking public read access!`);
  } else {
    console.log(`Anon can see post: slug=${anonData.slug}, status=${anonData.status}`);
  }
}

async function main() {
  await runBlogListQuery(supabaseAnon, 'ANON KEY (what the blog list page uses)');
  await runBlogListQuery(supabaseAdmin, 'SERVICE KEY (admin access)');
  await checkRLS();
}

main();
