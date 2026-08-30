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

  console.log("🚀 Inserting Post #10 into Supabase...");
  const rawDraft10 = fs.readFileSync('./scratch/post_10_draft.json', 'utf8');
  const draft10 = JSON.parse(rawDraft10);

  const images10 = {
    cover: 'https://i.ibb.co/ksZrx42m/data-science-hero-1788112186607.jpg',
    robotics: 'https://i.ibb.co/XrP16GMZ/ai-robotics-lab-1788112209178.jpg',
    discussion: 'https://i.ibb.co/v61ZhzPZ/data-discussion-campus-1788112235412.jpg'
  };

  let content10 = draft10.content;
  content10 = content10.replace('{{IMAGE_1_COVER}}', images10.cover);
  content10 = content10.replace('{{IMAGE_2_ROBOTICS}}', images10.robotics);
  content10 = content10.replace('{{IMAGE_3_DISCUSSION}}', images10.discussion);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: draft10.title,
    slug: draft10.slug,
    excerpt: draft10.excerpt,
    content: content10,
    cover_image_url: images10.cover,
    status: 'published',
    published_at: draft10.scheduled_at, // Scheduled for Sep 19, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #10:", error);
    process.exit(1);
  }

  console.log("🎉 Post #10 successfully scheduled in Supabase for September 19, 2026!");
}

main();
