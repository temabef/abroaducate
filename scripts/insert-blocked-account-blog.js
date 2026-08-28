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

const IMAGE_URLS = {
  cover: 'https://i.ibb.co/Xx6QsQ4Y/blocked-account-hero-1787917842687.jpg',
  workflow: 'https://i.ibb.co/p6v9T1SF/blocked-account-workflow-1787917858589.jpg',
  essentials: 'https://i.ibb.co/mry5sNyg/relocation-essentials-flatlay-1787917877049.jpg'
};

const title = 'How to Open a German Blocked Account (Sperrkonto) in 2026: Expatrio vs. Fintiba Complete Guide';
const slug = 'german-blocked-account-expatrio-fintiba-guide-2026';
const excerpt = 'Everything you need to know about the €11,904 German Blocked Account (Sperrkonto) requirement in 2026. Compare Expatrio vs. Fintiba, claim €49 fee cashback, and get your embassy confirmation fast.';

async function execute() {
  try {
    console.log("📖 Reading blog post draft...");
    let content = fs.readFileSync('./german_blocked_account_guide_2026.md', 'utf8');

    // Replace local image placeholders with uploaded ImgBB URLs
    content = content.replace('/01_blocked_account_hero.jpg', IMAGE_URLS.cover);
    content = content.replace('/02_blocked_account_workflow.jpg', IMAGE_URLS.workflow);
    content = content.replace('/03_relocation_essentials.jpg', IMAGE_URLS.essentials);

    console.log("🔍 Checking for author user...");
    const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
    let authorId = userData && userData.users.length > 0 ? userData.users[0].id : null;

    const payload = {
      title,
      slug,
      excerpt,
      content,
      cover_image_url: IMAGE_URLS.cover,
      status: 'published',
      published_at: new Date().toISOString(),
      author_user_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log("🚀 Upserting blog post in Supabase 'blog_posts' table...");
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error upserting blog post:", error.message);
      process.exit(1);
    }

    console.log("\n✨ SUCCESS! Blog post published with live CDN image URLs!");
    console.log("-----------------------------------------------------");
    console.log(`ID:      ${data.id}`);
    console.log(`Title:   ${data.title}`);
    console.log(`Slug:    ${data.slug}`);
    console.log(`Status:  ${data.status}`);
    console.log(`URL:     http://localhost:5173/blog/${data.slug}`);
    console.log("-----------------------------------------------------\n");

  } catch (err) {
    console.error("❌ Exception occurred:", err.message);
    process.exit(1);
  }
}

execute();
