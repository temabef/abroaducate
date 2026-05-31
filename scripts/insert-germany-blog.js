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

// Swappable ImgBB Image URLs (Replace these with the actual links once uploaded)
const IMAGE_URLS = {
  cover: 'https://i.ibb.co/gF4jYHTk/germany-no-ielts-hero.jpg', // Will use Image 1 as cover
  image1: 'https://i.ibb.co/7xW3Y4yq/ielts-alternatives-infographic.jpg',   // IELTS Alternatives infographic
  image2: 'https://i.ibb.co/cKqQ43xT/moi-letter-steps-graphic.jpg',   // MOI steps process graphic
  image3: 'https://i.ibb.co/9HxNS04k/germany-real-cost-diagram.jpg',   // Real Cost diagram
  image4: 'https://i.ibb.co/rSHdfqx/scholarship-radar.png'    // Scholarship Radar platform screenshot (Image 5)
};

const title = 'Free Universities in Germany for International Students Without IELTS (2026)';
const slug = 'free-universities-germany-no-ielts-2026';
const excerpt = 'Yes, you can study in Germany for free without an IELTS score. Here is the list of public universities accepting Medium of Instruction letters, plus how to apply.';

async function execute() {
  try {
    console.log("📖 Reading blog post draft from germany_blog_post_draft.md...");
    let content = fs.readFileSync('./germany_blog_post_draft.md', 'utf8');

    // Replace placeholders with actual URLs
    console.log("✏️  Substituting image placeholders...");
    content = content.replace('[IMAGE_1_PLACEHOLDER_IELTS_ALTERNATIVES]', `![Alternatives to IELTS accepted by German universities](${IMAGE_URLS.image1})`);
    content = content.replace('[IMAGE_2_PLACEHOLDER_MOI_STEPS]', `![How to get a Medium of Instruction (MOI) letter](${IMAGE_URLS.image2})`);
    content = content.replace('[IMAGE_3_PLACEHOLDER_REAL_COST]', `![The real cost of studying in Germany](${IMAGE_URLS.image3})`);
    content = content.replace('[IMAGE_4_PLACEHOLDER_SCHOLARSHIP_RADAR]', `![Abroaducate Scholarship Radar matching programs](${IMAGE_URLS.image4})`);

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
