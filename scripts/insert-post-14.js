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

  console.log("🚀 Inserting Post #14 into Supabase...");
  const rawData = fs.readFileSync('scratch/post_14_draft.json', 'utf8');
  const post = JSON.parse(rawData);

  const heroImg = 'https://i.ibb.co/rKN1RmwM/sweden-scholarship-hero-1788193104415.jpg';
  const libraryImg = 'https://i.ibb.co/Wvdh32Q6/nordic-university-library-1788193123388.jpg';
  const lifestyleImg = 'https://i.ibb.co/rGjNRqkx/sweden-student-lifestyle-1788193142639.jpg';

  let content = post.content
    .replace('{{IMAGE_1_COVER}}', heroImg)
    .replace('{{IMAGE_2_LIBRARY}}', libraryImg)
    .replace('{{IMAGE_3_LIFESTYLE}}', lifestyleImg);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: content,
    cover_image_url: heroImg,
    status: 'published',
    published_at: post.published_at, // Scheduled for Sep 27, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #14:", error);
    process.exit(1);
  }

  console.log("🎉 Post #14 successfully scheduled in Supabase for September 27, 2026!");
}

main();
