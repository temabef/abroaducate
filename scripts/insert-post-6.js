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

  console.log("🚀 Inserting & Scheduling Post #6 (Study in Austria in English)...");
  const rawDraft6 = fs.readFileSync('./scratch/post_6_draft.json', 'utf8');
  const draft6 = JSON.parse(rawDraft6);

  const images6 = {
    cover: 'https://i.ibb.co/yBpq3Y50/austria-study-cover-1787937472288.jpg',
    vienna: 'https://i.ibb.co/GQrVgfD1/vienna-student-study-1787937497669.jpg',
    card: 'https://i.ibb.co/fdJmhFRv/austria-student-residence-card-1787937522967.jpg'
  };

  let content6 = draft6.content;
  content6 = content6.replace('{{IMAGE_1_COVER}}', images6.cover);
  content6 = content6.replace('{{IMAGE_2_VIENNA}}', images6.vienna);
  content6 = content6.replace('{{IMAGE_3_CARD}}', images6.card);

  const { error } = await supabase.from('blog_posts').upsert({
    title: draft6.title,
    slug: draft6.slug,
    excerpt: draft6.excerpt,
    content: content6,
    cover_image_url: images6.cover,
    status: 'published',
    published_at: draft6.scheduled_at, // Scheduled for Sep 11, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error scheduling Post #6:", error);
    process.exit(1);
  }

  console.log("🎉 Post #6 successfully scheduled in Supabase!");
  console.log("   Title:", draft6.title);
  console.log("   Slug:", draft6.slug);
  console.log("   Scheduled Live Date:", draft6.scheduled_at);
}

main();
