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

const AFFILIATES = {
  expatrio: 'https://www.expatrio.com?p=abroaducate123',
  grey: 'https://app.grey.co/auth/register?referral=IAUZLT',
  translated: 'https://www.translated.net/en/preventivo.php?refid=7247',
  airalo: 'https://airalo.go.link/VyEma'
};

async function main() {
  const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
  const authorId = userData && userData.users.length > 0 ? userData.users[0].id : null;

  // ==========================================
  // 1. UPDATE POST #1 (Göttingen & Bonn Links)
  // ==========================================
  console.log("🔄 Updating Post #1 with exact molecular programs in our database...");
  const rawDraft1 = fs.readFileSync('./scratch/post_1_draft.json', 'utf8');
  const draft1 = JSON.parse(rawDraft1);

  const images1 = {
    cover: 'https://i.ibb.co/k2LB5925/biotech-masters-germany-cover-1787935144285.jpg',
    lab: 'https://i.ibb.co/5WDMnwjQ/biotech-lab-equipment-1787935483722.jpg',
    campus: 'https://i.ibb.co/bMbsNsFs/biotech-campus-study-1787935502813.jpg'
  };

  let content1 = draft1.content;
  content1 = content1.replace('{{IMAGE_1_COVER}}', images1.cover);
  content1 = content1.replace('{{IMAGE_2_LAB}}', images1.lab);
  content1 = content1.replace('{{IMAGE_3_CAMPUS}}', images1.campus);

  content1 = content1.replace(
    '15 out of 16 German federal states charge **€0 tuition fees**',
    '15 out of 16 German federal states charge **[€0 tuition fees](/programs/category/tuition-free)**'
  );
  content1 = content1.replace(
    'Research specific faculty module catalogs on Abroaducate.',
    'Explore verified degrees in our catalog like the **[University of Göttingen M.Sc. Molecular Life Sciences (Biotechnology & Biochemistry)](/programs/university-of-goettingen-molecular-life-sciences-microbiology-biotechnology-and-biochemistry)** or the **[University of Bonn M.Sc. Biology Program](/programs/university-of-bonn-organismic-biology-evolutionary-biology-and-palaeobiology-oep-biology)**.'
  );
  content1 = content1.replace(
    'certified translation service like **Translated.net**',
    `certified translation service like **[Translated.net](${AFFILIATES.translated})** (or check our **[Verified Relocation Toolkit](/toolkit)**)`
  );
  content1 = content1.replace(
    'open an **Expatrio Value Package**',
    `open an **[Expatrio Value Package](${AFFILIATES.expatrio})** (read our **[2026 German Blocked Account Guide](/blog/german-blocked-account-expatrio-fintiba-guide-2026)** or visit our **[Relocation Toolkit](/toolkit)**)`
  );

  await supabase.from('blog_posts').upsert({
    title: draft1.title,
    slug: draft1.slug,
    excerpt: draft1.excerpt,
    content: content1,
    cover_image_url: images1.cover,
    status: 'published',
    published_at: draft1.scheduled_at,
    author_user_id: authorId,
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });
  console.log("✅ Post #1 refreshed with verified program links!");

  // ==========================================
  // 2. UPDATE POST #2 (Italian Universities)
  // ==========================================
  console.log("🔄 Updating Post #2 with Italian university hub links...");
  const rawDraft2 = fs.readFileSync('./scratch/post_2_draft.json', 'utf8');
  const draft2 = JSON.parse(rawDraft2);

  const images2 = {
    cover: 'https://i.ibb.co/QjHhxjsR/italy-dsu-cover-1787935757791.jpg',
    dining: 'https://i.ibb.co/5WBjXpTK/italy-student-dining-1787935777755.jpg',
    documents: 'https://i.ibb.co/DDf7Vg6D/italy-visa-documents-1787935796287.jpg'
  };

  let content2 = draft2.content;
  content2 = content2.replace('{{IMAGE_1_COVER}}', images2.cover);
  content2 = content2.replace('{{IMAGE_2_DINING}}', images2.dining);
  content2 = content2.replace('{{IMAGE_3_DOCUMENTS}}', images2.documents);

  content2 = content2.replace(
    'attending public universities',
    'attending public universities across our **[Italy Degree Hub](/programs/country/italy)** and **[European Universities Directory](/universities)**'
  );
  content2 = content2.replace(
    'Politecnico di Milano, University of Padova, Sapienza',
    '**[Politecnico di Milano](/programs/country/italy/engineering)**, **[University of Padova](/programs/country/italy)**, or **[University of Trento](/programs/country/italy)**'
  );
  content2 = content2.replace(
    'use an accredited agency like **Translated.net**',
    `use an accredited agency like **[Translated.net](${AFFILIATES.translated})** (available directly in our **[Relocation Toolkit](/toolkit)**)`
  );
  content2 = content2.replace(
    'open a digital European EUR account via **Grey.co**',
    `open a digital European EUR account via **[Grey.co](${AFFILIATES.grey})** (or access it through our **[Relocation Toolkit](/toolkit)**)`
  );

  await supabase.from('blog_posts').upsert({
    title: draft2.title,
    slug: draft2.slug,
    excerpt: draft2.excerpt,
    content: content2,
    cover_image_url: images2.cover,
    status: 'published',
    published_at: draft2.scheduled_at,
    author_user_id: authorId,
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });
  console.log("✅ Post #2 refreshed with university hub links!");

  // ==========================================
  // 3. INSERT & SCHEDULE POST #4 (Chemistry & Materials Science)
  // ==========================================
  console.log("🚀 Inserting & Scheduling Post #4 (Chemistry & Materials Science)...");
  const rawDraft4 = fs.readFileSync('./scratch/post_4_draft.json', 'utf8');
  const draft4 = JSON.parse(rawDraft4);

  const images4 = {
    cover: 'https://i.ibb.co/PZDG8hW8/chemistry-masters-cover-1787936366011.jpg',
    spectrometer: 'https://i.ibb.co/nM0XvfrK/chemistry-spectrometer-1787936385524.jpg',
    discussion: 'https://i.ibb.co/GQGKKdTr/chemistry-campus-discussion-1787936406689.jpg'
  };

  let content4 = draft4.content;
  content4 = content4.replace('{{IMAGE_1_COVER}}', images4.cover);
  content4 = content4.replace('{{IMAGE_2_SPECTROMETER}}', images4.spectrometer);
  content4 = content4.replace('{{IMAGE_3_DISCUSSION}}', images4.discussion);

  // Link to actual materials/metallurgy program in DB:
  content4 = content4.replace(
    'explore programs across our **[Germany Degree Hub](/programs/country/germany)**',
    'explore programs across our **[Germany Degree Hub](/programs/country/germany)** (such as the [University of Duisburg-Essen M.Sc. Metallurgy & Materials](/programs/university-of-duisburg-essen-metallurgy-and-metal-forming-ise))'
  );

  const { error: err4 } = await supabase.from('blog_posts').upsert({
    title: draft4.title,
    slug: draft4.slug,
    excerpt: draft4.excerpt,
    content: content4,
    cover_image_url: images4.cover,
    status: 'published',
    published_at: draft4.scheduled_at, // Scheduled for Sep 7, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (err4) {
    console.error("❌ Error scheduling Post #4:", err4);
    process.exit(1);
  }

  console.log("🎉 Post #4 successfully scheduled in Supabase!");
  console.log("   Title:", draft4.title);
  console.log("   Slug:", draft4.slug);
  console.log("   Scheduled Live Date:", draft4.scheduled_at);
}

main();
