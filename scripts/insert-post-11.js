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

  console.log("🚀 Inserting Post #11 into Supabase...");
  const rawDraft11 = fs.readFileSync('./scratch/post_11_draft.json', 'utf8');
  const draft11 = JSON.parse(rawDraft11);

  const images11 = {
    cover: 'https://i.ibb.co/NgqRTVQb/esim-arrival-hero-1788112358123.jpg',
    qr: 'https://i.ibb.co/qYQTxvYw/esim-qr-screen-1788112380943.jpg',
    train: 'https://i.ibb.co/R8RKLxY/train-navigation-esim-1788112404248.jpg'
  };

  let content11 = draft11.content;
  content11 = content11.replace('{{IMAGE_1_COVER}}', images11.cover);
  content11 = content11.replace('{{IMAGE_2_QR}}', images11.qr);
  content11 = content11.replace('{{IMAGE_3_TRAIN}}', images11.train);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: draft11.title,
    slug: draft11.slug,
    excerpt: draft11.excerpt,
    content: content11,
    cover_image_url: images11.cover,
    status: 'published',
    published_at: draft11.scheduled_at, // Scheduled for Sep 21, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #11:", error);
    process.exit(1);
  }

  console.log("🎉 Post #11 successfully scheduled in Supabase for September 21, 2026!");
}

main();
