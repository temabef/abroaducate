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

  console.log("🚀 Inserting Post #8 into Supabase...");
  const rawDraft8 = fs.readFileSync('./scratch/post_8_draft.json', 'utf8');
  const draft8 = JSON.parse(rawDraft8);

  const images8 = {
    cover: 'https://i.ibb.co/6cvbmFKc/env-science-hero-1788111609870.jpg',
    lab: 'https://i.ibb.co/23jZkpVv/wind-energy-lab-1788111627335.jpg',
    field: 'https://i.ibb.co/9zpyF3W/forest-field-study-1788111646386.jpg'
  };

  let content8 = draft8.content;
  content8 = content8.replace('{{IMAGE_1_COVER}}', images8.cover);
  content8 = content8.replace('{{IMAGE_2_LAB}}', images8.lab);
  content8 = content8.replace('{{IMAGE_3_FIELD}}', images8.field);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: draft8.title,
    slug: draft8.slug,
    excerpt: draft8.excerpt,
    content: content8,
    cover_image_url: images8.cover,
    status: 'published',
    published_at: draft8.scheduled_at, // Scheduled for Sep 15, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #8:", error);
    process.exit(1);
  }

  console.log("🎉 Post #8 successfully scheduled in Supabase for September 15, 2026!");
}

main();
