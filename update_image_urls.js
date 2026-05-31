import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SLUG = 'program-or-scholarship-first';

// Old URL → New URL
const REPLACEMENTS = [
  [
    'https://i.ibb.co/Rk1VtLGy/blog-platform-radar-mockup.jpg',
    'https://i.ibb.co/MyZz7Z87/blog-platform-radar-mockup.jpg'
  ],
  [
    'https://i.ibb.co/4Z9m3qbk/blog-flowchart-infographic.jpg',
    'https://i.ibb.co/JjK6HLyd/blog-flowchart-infographic.jpg'
  ],
  [
    'https://i.ibb.co/cSSsyNsQ/blog-timeline-graphic.jpg',
    'https://i.ibb.co/Zzn78NBL/blog-timeline-graphic.jpg'
  ]
];

async function run() {
  console.log(`📥 Fetching post: ${SLUG}...`);
  const { data: post, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, content')
    .eq('slug', SLUG)
    .single();

  if (fetchErr || !post) {
    console.error('❌ Could not fetch post:', fetchErr?.message);
    process.exit(1);
  }

  let content = post.content;
  let changeCount = 0;

  for (const [oldUrl, newUrl] of REPLACEMENTS) {
    if (content.includes(oldUrl)) {
      content = content.replaceAll(oldUrl, newUrl);
      console.log(`✅ Replaced: ...${oldUrl.slice(-40)}`);
      console.log(`        → ...${newUrl.slice(-40)}`);
      changeCount++;
    } else {
      console.log(`⚠️  Not found (skipped): ...${oldUrl.slice(-40)}`);
    }
  }

  if (changeCount === 0) {
    console.log('\nℹ️  No changes needed — all URLs already up to date.');
    process.exit(0);
  }

  console.log(`\n💾 Saving ${changeCount} update(s) to database...`);
  const { error: updateErr } = await supabase
    .from('blog_posts')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', post.id);

  if (updateErr) {
    console.error('❌ Update failed:', updateErr.message);
    process.exit(1);
  }

  console.log('\n✨ SUCCESS! Image URLs updated in Supabase.');
  console.log(`   Post: /blog/${SLUG}`);
}

run();
