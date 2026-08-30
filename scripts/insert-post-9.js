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

  console.log("🚀 Inserting Post #9 into Supabase...");
  const rawDraft9 = fs.readFileSync('./scratch/post_9_draft.json', 'utf8');
  const draft9 = JSON.parse(rawDraft9);

  const images9 = {
    cover: 'https://i.ibb.co/nsHqT4tH/france-student-hero-1788111870476.jpg',
    housing: 'https://i.ibb.co/ksbwmbC6/caf-student-housing-1788111890250.jpg',
    docs: 'https://i.ibb.co/HLP0v1fQ/campus-france-docs-1788111915814.jpg'
  };

  let content9 = draft9.content;
  content9 = content9.replace('{{IMAGE_1_COVER}}', images9.cover);
  content9 = content9.replace('{{IMAGE_2_HOUSING}}', images9.housing);
  content9 = content9.replace('{{IMAGE_3_DOCS}}', images9.docs);

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: draft9.title,
    slug: draft9.slug,
    excerpt: draft9.excerpt,
    content: content9,
    cover_image_url: images9.cover,
    status: 'published',
    published_at: draft9.scheduled_at, // Scheduled for Sep 17, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting Post #9:", error);
    process.exit(1);
  }

  console.log("🎉 Post #9 successfully scheduled in Supabase for September 17, 2026!");
}

main();
