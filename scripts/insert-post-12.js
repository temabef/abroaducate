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

  console.log("🚀 Inserting Post #12 into Supabase...");
  const rawDraft12 = fs.readFileSync('./scratch/post_12_draft.json', 'utf8');
  const draft12 = JSON.parse(rawDraft12);

  const images12 = {
    cover: 'https://i.ibb.co/5WZ0ZKBR/biomedical-eng-hero-1788112610918.jpg',
    lab: 'https://i.ibb.co/5WDMnwjQ/biotech-lab-equipment-1787935483722.jpg',
    discussion: 'https://i.ibb.co/v61ZhzPZ/data-discussion-campus-1788112235412.jpg'
  };

  let content12 = draft12.content;
  content12 = content12.replace('{{IMAGE_1_COVER}}', images12.cover);
  content12 = content12.replace('{{IMAGE_2_LAB}}', images12.lab);
  content12 = content12.replace('{{IMAGE_3_DISCUSSION}}', images12.discussion);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: draft12.title,
    slug: draft12.slug,
    excerpt: draft12.excerpt,
    content: content12,
    cover_image_url: images12.cover,
    status: 'published',
    published_at: draft12.scheduled_at, // Scheduled for Sep 23, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #12:", error);
    process.exit(1);
  }

  console.log("🎉 Post #12 successfully scheduled in Supabase for September 23, 2026!");
}

main();
