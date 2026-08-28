import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase URL or service role key in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function main() {
  const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
  const authorId = userData && userData.users.length > 0 ? userData.users[0].id : null;

  console.log("🚀 Inserting & Scheduling Post #5 (Blocked Account Comparison)...");
  const rawDraft5 = fs.readFileSync('./scratch/post_5_draft.json', 'utf8');
  const draft5 = JSON.parse(rawDraft5);

  const images5 = {
    cover: 'https://i.ibb.co/4gMD9sGD/blocked-account-compare-cover-1787936813537.jpg',
    banking: 'https://i.ibb.co/SXgGMdMZ/blocked-account-app-screen-1787936837035.jpg',
    arrival: 'https://i.ibb.co/wFwzqvcq/student-arrival-germany-1787936872972.jpg'
  };

  let content5 = draft5.content;
  content5 = content5.replace('{{IMAGE_1_COVER}}', images5.cover);
  content5 = content5.replace('{{IMAGE_2_BANKING}}', images5.banking);
  content5 = content5.replace('{{IMAGE_3_ARRIVAL}}', images5.arrival);

  const { error } = await supabase.from('blog_posts').upsert({
    title: draft5.title,
    slug: draft5.slug,
    excerpt: draft5.excerpt,
    content: content5,
    cover_image_url: images5.cover,
    status: 'published',
    published_at: draft5.scheduled_at, // Scheduled for Sep 9, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error scheduling Post #5:", error);
    process.exit(1);
  }

  console.log("🎉 Post #5 successfully scheduled in Supabase!");
  console.log("   Title:", draft5.title);
  console.log("   Slug:", draft5.slug);
  console.log("   Scheduled Live Date:", draft5.scheduled_at);
}

main();
