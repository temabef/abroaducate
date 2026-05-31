import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("🔍 Fetching posts from database...");
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, status, published_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Error fetching posts:", error.message);
    process.exit(1);
  }

  console.log(`\nFound ${posts.length} posts total in database:\n`);
  posts.forEach(p => {
    console.log(`- Title:  ${p.title}`);
    console.log(`  Slug:   ${p.slug}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Pub At: ${p.published_at}`);
    console.log(`  Cre At: ${p.created_at}`);
    console.log("-----------------------------------------");
  });
}

check();
