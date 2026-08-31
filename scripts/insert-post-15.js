import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
  const authorId = userData && userData.users.length > 0 ? userData.users[0].id : null;

  console.log("🚀 Inserting Post #15 into Supabase...");
  const rawData = fs.readFileSync('scratch/post_15_draft.json', 'utf8');
  const post = JSON.parse(rawData);

  const heroImg = 'https://i.ibb.co/C3TkTjsT/germany-top-unis-hero-1788193161880.jpg';
  const lectureImg = 'https://i.ibb.co/DTkJW24/german-lecture-hall-1788193181647.jpg';
  const graduatesImg = 'https://i.ibb.co/YB4dYHp3/german-campus-graduates-1788193201471.jpg';

  let content = post.content
    .replace('{{IMAGE_1_COVER}}', heroImg)
    .replace('{{IMAGE_2_LECTURE}}', lectureImg)
    .replace('{{IMAGE_3_GRADUATES}}', graduatesImg);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: content,
    cover_image_url: heroImg,
    status: 'published',
    published_at: post.published_at, // Scheduled for Sep 29, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #15:", error);
    process.exit(1);
  }

  console.log("🎉 Post #15 successfully scheduled in Supabase for September 29, 2026!");
}

main();
