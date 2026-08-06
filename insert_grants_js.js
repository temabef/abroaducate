import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environmental variables from .env
dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase URL or service role key in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const content = `# How to Find Professors with Active Grants (When the Data is Everywhere)

I recently received a message on LinkedIn that perfectly captured one of the most frustrating parts of applying for grad school:

*"I came across your post about finding professors through active grants, and it really got me thinking... I was curious how you actually go about identifying relevant profs when the data feels so scattered across different sources. Would you mind sharing a bit about your approach?"*

If you have ever tried to find a fully funded PhD or Master's position, you know exactly what they mean. The data *is* everywhere. University websites are notoriously outdated, faculty pages haven't been updated since 2019, and funding databases can feel like they require a degree in data science just to navigate.

But here is the truth: finding professors with active grants is the most reliable way to secure funding. A professor who just won a major grant has the money to hire research assistants *right now*. 

Here is the exact system I use to cut through the noise and find those opportunities.

---

## Step 1: Follow the Money (Use National Databases)

The biggest mistake students make is starting their search on university websites. Instead, you need to go straight to the source of the funding: the national research councils and government databases. 

When a professor wins a grant, it becomes public record. Here is where you look:

- **USA:** The [NSF Award Search](https://www.nsf.gov/awardsearch/) (National Science Foundation) and [NIH RePORTER](https://reporter.nih.gov/) (National Institutes of Health). 
- **UK:** The [UKRI Gateway](https://gtr.ukri.org/) (UK Research and Innovation).
- **Canada:** The [NSERC Awards Database](https://www.nserc-crsng.gc.ca/ase-oro/index_eng.asp).
- **Europe:** [CORDIS](https://cordis.europa.eu/projects/en) (for EU-funded projects like Horizon Europe).

### How to search effectively:
Do not search for broad terms like "Computer Science." Instead, search for highly specific keywords related to your niche (e.g., "federated learning healthcare" or "microplastic soil remediation"). Filter by "Active" awards and sort by the most recently awarded dates. You want to find grants that were awarded in the last 3-6 months.

![Searching active grant databases](https://i.ibb.co/scy19dq/database-search-illustration-1784978802339.jpg)

---

## Step 2: Cross-Reference and Verify

Once you find a grant that matches your interests, you will see a "Principal Investigator" (PI)—this is the professor. Now it is time to do some detective work.

Look up the professor and cross-reference the grant with their lab website or university profile. 
- Are they at a university you want to attend? 
- Does their lab website have an "Openings" or "Join Us" section? (Even if it says nothing about open positions, the recent grant is proof they have funding).
- Read their 2-3 most recent publications to ensure their current work aligns with your skills.

---

## Step 3: Check Academic Twitter (X) and LinkedIn

While databases are great, professors often announce their grants and immediate openings on social media long before university websites are updated. 

Search Twitter or LinkedIn for phrases like:
- "Thrilled to announce we have been awarded"
- "Looking for fully funded PhD"
- "I am hiring a postdoc or PhD" + [Your Field]

This is often the fastest way to find professors who are actively recruiting *this week*.

---

## Step 4: The Cold Email Strategy

![Targeted cold email strategy](https://i.ibb.co/XrdcNY2f/cold-email-strategy-1784978809875.jpg)

Now that you have a list of professors with fresh funding, it is time to reach out. Since you know they have an active grant, your email should be highly targeted.

**Do not say:** "I am looking for a PhD position and am interested in your work."

**Do say:** "I saw your recent NSF grant on [Topic] and read your recent paper on [Specific finding]. My background in [Your Skill] aligns perfectly with the next phase of this project. Are you currently recruiting PhD students for this grant cycle?"

This proves you did your homework and positions you as a solution to their immediate hiring needs.

---

## Stop Guessing, Start Targeting

Yes, the data is scattered. But by avoiding outdated university websites and focusing instead on active grant databases and academic social media, you can drastically increase your chances of finding a fully funded position. 

Remember, professors with new grants *want* to find talented students to execute their research. You just have to know where to look.

> **Need help with your outreach?** Getting the email right is just as important as finding the professor. Use our [Cover Letters](/cover-letters) tool to draft the perfect cold email that gets replies.`;

async function execute() {
  try {
    const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
    let authorId = (userData && userData.users.length > 0) ? userData.users[0].id : null;

    const payload = {
      title: 'How to Find Professors with Active Grants (When the Data is Everywhere)',
      slug: 'how-to-find-professors-active-grants',
      excerpt: "Struggling to find funded research opportunities? Learn the step-by-step system for cutting through scattered data to find professors actively hiring PhD and Master's students.",
      content: content,
      cover_image_url: 'https://i.ibb.co/N2JwfNCx/grants-cover-image-1784978794123.jpg',
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
    console.log(`URL:     /blog/${data.slug}\n`);
  } catch (err) {
    console.error("❌ Exception:", err.message);
  }
}
execute();
