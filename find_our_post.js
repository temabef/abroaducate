import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function find() {
  console.log("🔍 Finding post with slug: program-or-scholarship-first...");
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', 'program-or-scholarship-first')
    .single();

  if (error) {
    console.error("❌ Error finding post:", error.message);
    process.exit(1);
  }

  console.log("\nFound Post details:");
  console.log("-------------------");
  console.log("ID:             ", post.id);
  console.log("Title:          ", post.title);
  console.log("Slug:           ", post.slug);
  console.log("Status:         ", post.status);
  console.log("Published At:   ", post.published_at);
  console.log("Created At:     ", post.created_at);
  console.log("Author User ID: ", post.author_user_id);
  console.log("Excerpt:        ", post.excerpt ? post.excerpt.substring(0, 100) + '...' : 'none');
  console.log("Cover Image URL:", post.cover_image_url);
}

find();
