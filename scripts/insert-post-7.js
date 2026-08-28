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

  console.log("🚀 Inserting & Scheduling Post #7 (MOI & IELTS Waiver)...");
  const rawDraft7 = fs.readFileSync('./scratch/post_7_draft.json', 'utf8');
  const draft7 = JSON.parse(rawDraft7);

  const images7 = {
    cover: 'https://i.ibb.co/BHbz0DmQ/moi-ielts-waiver-cover-1787937686746.jpg',
    documents: 'https://i.ibb.co/DDf7Vg6D/italy-visa-documents-1787935796287.jpg'
  };

  let content7 = draft7.content;
  content7 = content7.replace('{{IMAGE_1_COVER}}', images7.cover);
  content7 = content7.replace('{{IMAGE_2_DOCUMENTS}}', images7.documents);

  const { error } = await supabase.from('blog_posts').upsert({
    title: draft7.title,
    slug: draft7.slug,
    excerpt: draft7.excerpt,
    content: content7,
    cover_image_url: images7.cover,
    status: 'published',
    published_at: draft7.scheduled_at, // Scheduled for Sep 13, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error scheduling Post #7:", error);
    process.exit(1);
  }

  console.log("🎉 Post #7 successfully scheduled in Supabase!");
  console.log("   Title:", draft7.title);
  console.log("   Slug:", draft7.slug);
  console.log("   Scheduled Live Date:", draft7.scheduled_at);
}

main();
