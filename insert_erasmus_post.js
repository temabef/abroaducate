import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environmental variables from .env
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

const title = 'Erasmus Mundus 2026: How to Write a Winning Application';
const slug = 'erasmus-mundus-2026-winning-application';
const excerpt = 'Get your entire degree paid for by the European Union. From SOP structure to Europass CV formatting, here is the exact blueprint to writing a winning Erasmus Mundus Joint Masters application.';

// Support passing the cloud image URL as a CLI argument, otherwise default to local static asset
const cover_image_url = process.argv[2] || '/erasmus_mundus_2026_hero.png';

async function execute() {
  try {
    console.log("📖 Reading blog post draft from erasmus_mundus_winning_application_draft.md...");
    const content = fs.readFileSync('./erasmus_mundus_winning_application_draft.md', 'utf8');

    console.log("🔍 Checking for existing user in auth.users to assign as author...");
    // Retrieve the first user in auth.users to serve as author
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
      cover_image_url,
      status: 'published',
      published_at: new Date().toISOString(),
      author_user_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`🚀 Inserting/upserting blog post in 'blog_posts' table...`);
    console.log(`Cover Image URL: ${cover_image_url}`);
    
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
    console.log(`Image:   ${data.cover_image_url}`);
    console.log(`URL:     /blog/${data.slug}`);
    console.log("-----------------------------------------------------\n");

  } catch (err) {
    console.error("❌ Exception occurred during execution:", err.message);
    process.exit(1);
  }
}

execute();
