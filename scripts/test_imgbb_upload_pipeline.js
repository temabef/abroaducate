import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!IMGBB_API_KEY) {
  console.error("❌ Error: IMGBB_API_KEY is missing from .env!");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Supabase credentials missing from .env!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Helper to upload a local image file directly to ImgBB via REST API
async function uploadToImgBB(filePath, customName) {
  console.log(`📤 Uploading ${path.basename(filePath)} to ImgBB...`);
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  if (customName) {
    formData.append('name', customName);
  }

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(`ImgBB API Error: ${json.error?.message || JSON.stringify(json)}`);
  }

  const uploadedUrl = json.data.url;
  console.log(`✅ Uploaded successfully -> ${uploadedUrl}`);
  return uploadedUrl;
}

async function runPipeline() {
  console.log("🚀 Starting End-to-End Automated Blog & ImgBB Upload Pipeline...\n");

  const imagePaths = [
    'C:/Users/HP ENVY X360/.gemini/antigravity-ide/brain/9f0220f3-29ad-44db-8182-5dae0ee17686/student_housing_hero_1788264253198.jpg',
    'C:/Users/HP ENVY X360/.gemini/antigravity-ide/brain/9f0220f3-29ad-44db-8182-5dae0ee17686/housing_keys_contract_1788264265739.jpg',
    'C:/Users/HP ENVY X360/.gemini/antigravity-ide/brain/9f0220f3-29ad-44db-8182-5dae0ee17686/student_courtyard_lounge_1788264276228.jpg'
  ];

  // 1. Upload all 3 images automatically
  const heroUrl = await uploadToImgBB(imagePaths[0], 'student_housing_hero_2026');
  const contractUrl = await uploadToImgBB(imagePaths[1], 'housing_keys_contract_2026');
  const loungeUrl = await uploadToImgBB(imagePaths[2], 'student_courtyard_lounge_2026');

  console.log("\n🔗 All 3 Images Uploaded & Hosted on ImgBB CDN:");
  console.log(`1. Hero: ${heroUrl}`);
  console.log(`2. Contract: ${contractUrl}`);
  console.log(`3. Lounge: ${loungeUrl}\n`);

  // 2. Draft the high-intent article with verified affiliate links
  const postTitle = "How to Rent Student Accommodation in Germany & Europe Without Deposit Scams (2026 Guide)";
  const postSlug = "how-to-rent-student-accommodation-germany-europe-without-scams-guide";
  const postExcerpt = "A complete international student guide to finding affordable, verified student housing, navigating German WG-Zimmer, securing City Registration (Anmeldung), and dodging rental scams in 2026.";

  const AMBER_URL = "https://amberstudent.com/flex/abroaducate-1788253425";
  const EXPATRIO_URL = "https://www.expatrio.com?p=abroaducate123";
  const GREY_URL = "https://app.grey.co/auth/register?referral=IAUZLT";
  const TRANSLATED_URL = "https://www.translated.net/en/preventivo.php?refid=7247";
  const AIRALO_URL = "https://airalo.go.link/VyEma";

  const content = `![Student Accommodation in Europe](${heroUrl})

Finding safe, affordable student housing is universally ranked by international students as the single most stressful hurdle of studying abroad in Germany, the UK, France, and across Europe. 

With municipal university dorms (*Studentenwerk / CROUS*) facing multi-semester waiting lists in high-demand student cities like Munich, Berlin, Paris, Dublin, and London, thousands of incoming non-EU students turn to the private rental market. Unfortunately, international applicants are prime targets for sophisticated online rental scams, fake landlord identities, and illegal deposit requests via wire transfer.

In this comprehensive 2026 guide, you will learn the exact breakdown of European student housing options, how city registration (*Anmeldung*) works, the 5 red flags of rental scams, and how to reserve verified student accommodation safely before your flight.

---

## 1. European Student Housing Types Explained

Before beginning your housing search, understand the four primary accommodation categories available to international students:

| Accommodation Type | Average Monthly Rent | Pros | Cons | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Public Dorms (*Studentenwerk / CROUS*)** | €280 – €480 / month | Lowest cost, bills included, on campus | 6–18 month waiting queues, high rejection rate | Early applicants with lottery luck |
| **Purpose-Built Student Accommodation (PBSA)** | €550 – €950 / month | Fully furnished, private studio/en-suite, gym, WiFi, 100% scam-proof | Slightly higher cost than public dorms | International students wanting guaranteed arrival housing |
| **Shared Flat (*WG - Wohngemeinschaft*)** | €400 – €750 / month | Great social life, shared utilities, authentic local experience | Competitive *WG-Casting* interviews, potential scam risk | Students already in the country |
| **Private Studio / Apartment** | €700 – €1,300+ / month | Total privacy, private kitchen & bathroom | High deposit (*Kaution*), agency fees, competitive | Working master's/PhD students & couples |

> 🏠 **Verified Student Housing Shortcut:** If you want to bypass 12-month public dorm waitlists and avoid sketchy private landlord classifieds, you can search and secure 100% verified student rooms, private studios, and shared flats with zero booking fees and price match guarantees on **[Amber Student Accommodation Europe](${AMBER_URL})**.

---

## 2. The 5 Major Student Rental Scams & How to Spot Them

![Signing a verified rental agreement without deposit scams](${contractUrl})

Rental fraud targeting international students typically follows predictable patterns. Watch out for these five critical warning signs:

### 🚩 Red Flag 1: The "Landlord is Abroad" Story
The most common European rental scam involves a landlord who claims to be working overseas (often in the UK, Spain, or Nigeria) and cannot show you the flat in person. They promise to courier the keys via a fake DHL, Airbnb, or TripAdvisor escrow service once you wire a deposit. 
* **Reality:** Legitimate landlords or verified booking platforms never ask for personal wire transfers to third-party accounts.

### 🚩 Red Flag 2: Refusal to Provide *Wohnungsgeberbestätigung* (City Registration)
In Germany (*Anmeldung*), Austria (*Meldezettel*), and France, registering your address with the municipal town hall within 14 days is a strict legal requirement. Without an official **Landlord Confirmation Form (*Wohnungsgeberbestätigung*)**, you cannot:
1. Open a permanent German bank account or unlock your **[Expatrio Blocked Account](${EXPATRIO_URL})**.
2. Obtain your German Tax ID (*Steuer-ID*) required for student mini-jobs.
3. Complete your residence permit appointment at the *Ausländerbehörde*.

* **Rule:** If a subletter or landlord tells you *"You can live here, but you cannot register (Keine Anmeldung)"*, walk away immediately.

### 🚩 Red Flag 3: Pressure to Wire Money via Western Union or Untraceable Apps
Scammers will create urgent artificial deadlines (e.g., *"3 other students want this room, pay €1,200 deposit today to secure it"*). Always pay legitimate deposits through official European banking channels with a Virtual EUR IBAN via **[Grey.co](${GREY_URL})** or certified student platform escrow so all transactions have an audit trail.

### 🚩 Red Flag 4: Rent That Is Too Good to Be True
A luxury, fully furnished 1-bedroom apartment in central Munich, Amsterdam, or Paris listed for €450/month does not exist. Research average district market prices before sending inquiries.

### 🚩 Red Flag 5: Stolen Property Images
Always perform a reverse image search on Google or TinEye for photos in private Facebook housing groups or generic classified websites. Scammers routinely scrape photos from hotel websites and luxury interior design blogs.

---

## 3. Step-by-Step Checklist to Secure Housing Before Landing

![Modern student residence lounge and community in Europe](${loungeUrl})

Follow this 5-step blueprint to secure verified accommodation from your home country:

### Step 1: Apply to Public University Dorms Immediately
As soon as you receive your university admission letter (or even conditional acceptance), submit your application to the local *Studentenwerk* (Germany) or *CROUS* (France).

### Step 2: Book Verified Private Student Housing (PBSA)
Because public dorm demand exceeds supply by over 400%, secure a backup through verified international student housing providers like **[Amber Student](${AMBER_URL})**. Look for rooms that include:
- Official lease agreement valid for embassy visa processing and town hall registration (*Anmeldung*).
- All-inclusive utility bills (water, heating, electricity, and high-speed internet).
- Free cancellation policies in case of visa rejection.

### Step 3: Prepare Your Certified Rental Documentation
Landlords and student residences will ask for proof of financial capability, your admission letter, and passport copies. If your documents, guarantor forms, or employment letters are in English, French, or your local language, ensure you have certified translations ready via **[Translated.net](${TRANSLATED_URL})**.

### Step 4: Set Up Your Arrival Mobile Connectivity
When navigating to your new student apartment from the airport, you need immediate maps, WhatsApp, and landlord communication without expensive roaming charges. Download an eSIM before your flight with a €3 voucher on **[Airalo Europe eSIM](${AIRALO_URL})**.

### Step 5: Complete Your City Registration (*Anmeldung*) on Week 1
Within 14 days of arrival, take your passport, rental agreement, and signed *Wohnungsgeberbestätigung* to the local citizens' office (*Bürgeramt*). Once registered, your official confirmation letter will unlock your blocked account disbursements and university matriculation.

---

## 4. Frequently Asked Questions (FAQ)

### What is the average deposit (*Kaution*) for European student housing?
In Germany and Austria, standard security deposits equal **2 to 3 months of cold rent (*Kaltmiete*)**. By law, landlords must hold this deposit in a dedicated escrow account and refund it with interest upon move-out if no damages occur.

### Can I book student accommodation before receiving my student visa?
Yes. Top student accommodation platforms provide **Visa Refund Guarantees**—if your student visa is delayed or denied, your booking deposit is refunded upon providing the embassy rejection letter.

### How do I pay my European rental deposit from Africa or Asia without high wire fees?
Use cross-border student banking platforms like **[Grey.co](${GREY_URL})** to convert local currency (Naira, Cedi, KES) to EUR at competitive market rates and send SEPA transfers directly to your housing provider's IBAN.

---

### Ready to Find Your Verified Student Home?
* Explore over 100,000+ verified student rooms, studios, and shared flats across Europe on **[Amber Student Accommodation](${AMBER_URL})**.
* Compare student visa blocked accounts and statutory health insurance on **[Expatrio](${EXPATRIO_URL})**.
* Find top English-taught degree programs with low tuition on the **[Abroaducate Program Finder](/programs)**.`;

  // 3. Insert into Supabase scheduled for October 01, 2026
  const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
  const authorId = userData && userData.users.length > 0 ? userData.users[0].id : null;

  const { data, error } = await supabase.from('blog_posts').upsert({
    title: postTitle,
    slug: postSlug,
    excerpt: postExcerpt,
    content: content,
    cover_image_url: heroUrl,
    status: 'published',
    published_at: '2026-10-01T08:00:00+00:00', // Scheduled for October 1, 2026
    author_user_id: authorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' });

  if (error) {
    console.error("❌ Error inserting test post into Supabase:", error);
    process.exit(1);
  }

  console.log("🎉 SUCCESS! Test Post fully generated, images uploaded via ImgBB API, and scheduled in Supabase!");
  console.log(`🔗 Post Slug: /blog/${postSlug}`);
}

runPipeline();
