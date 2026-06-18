import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env in the workspace root
dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase URL or service role key in .env file.");
  process.exit(1);
}

// Initialize Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const IMAGE_URLS = {
  cover: 'https://i.ibb.co/DDSPpjMz/proof-of-funds-hero.png',
  vault: 'https://i.ibb.co/99dxhZLV/scholarship-unlocks-vault.png'
};

const title = 'How to Prove Your Financial Resources for a European Student Visa';
const slug = 'how-to-prove-financial-resources-european-student-visa';
const excerpt = 'Funding is the #1 hurdle for international students. Here is exactly what a Blocked Account is, how much is required, and how a scholarship can waive proof of funds entirely.';

async function execute() {
  try {
    console.log("📖 Reading blog post draft...");
    let content = fs.readFileSync('./proof_of_funds_blog_draft.md', 'utf8');

    // Replace placeholders with actual ImgBB URLs
    console.log("✏️  Substituting image URLs...");
    content = content.replace('](/proof_of_funds_hero.png)', `](${IMAGE_URLS.cover})`);
    content = content.replace('](/scholarship_unlocks_vault.png)', `](${IMAGE_URLS.vault})`);

    console.log("🔍 Checking for existing user in auth.users to assign as author...");
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({ limit: 1 });
    
    let authorId = null;
    if (userError) {
      console.warn("⚠️ Warning checking auth.users:", userError.message);
    } else if (userData && userData.users.length > 0) {
      authorId = userData.users[0].id;
      console.log(`✅ Assigned author_user_id: ${authorId}`);
    } else {
      console.log("ℹ️ No users found in auth.users, inserting post with author_user_id = null");
    }

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

    console.log("🚀 Inserting/upserting blog post in 'blog_posts' table...");
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error upserting blog post:", error.message);
      process.exit(1);
    }

    console.log("\n✨ SUCCESS! Blog post uploaded directly to Supabase!");
    console.log("-----------------------------------------------------");
    console.log(`ID:      ${data.id}`);
    console.log(`Title:   ${data.title}`);
    console.log(`Slug:    ${data.slug}`);
    console.log(`Status:  ${data.status}`);
    console.log(`URL:     /blog/${data.slug}`);
    console.log("-----------------------------------------------------\n");

  } catch (err) {
    console.error("❌ Exception occurred during execution:", err.message);
    process.exit(1);
  }
}

execute();
