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

  console.log("🚀 Inserting Post #13 into Supabase...");
  const rawData = fs.readFileSync('scratch/post_13_draft.json', 'utf8');
  const post = JSON.parse(rawData);

  const heroImg = 'https://i.ibb.co/N2PnTNyf/cimea-universitaly-hero-1788193053936.jpg';
  const docsImg = 'https://i.ibb.co/kVvfdDgf/cimea-diploma-docs-1788193071702.jpg';
  const studentsImg = 'https://i.ibb.co/LDQ2h09y/italian-campus-students-1788193087965.jpg';

  let content = post.content
    .replace('{{IMAGE_1_COVER}}', heroImg)
    .replace('{{IMAGE_2_DOCS}}', docsImg)
    .replace('{{IMAGE_3_STUDENTS}}', studentsImg);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: content,
    cover_image_url: heroImg,
    status: 'published',
    published_at: post.published_at, // Scheduled for Sep 25, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #13:", error);
    process.exit(1);
  }

  console.log("🎉 Post #13 successfully scheduled in Supabase for September 25, 2026!");
}

main();
