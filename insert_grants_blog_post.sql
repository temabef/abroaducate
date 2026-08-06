-- SQL script to insert the "How to Find Professors with Active Grants" blog post
-- Run this in your Supabase SQL Editor to publish the article

INSERT INTO blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  cover_image_url, 
  status, 
  published_at, 
  author_user_id,
  created_at
) VALUES (
  'How to Find Professors with Active Grants (When the Data is Everywhere)',
  'how-to-find-professors-active-grants',
  'Struggling to find funded research opportunities? Learn the step-by-step system for cutting through scattered data to find professors actively hiring PhD and Master''s students.',
  '# How to Find Professors with Active Grants (When the Data is Everywhere)

I recently received a message on LinkedIn that perfectly captured one of the most frustrating parts of applying for grad school:

*"I came across your post about finding professors through active grants, and it really got me thinking... I was curious how you actually go about identifying relevant profs when the data feels so scattered across different sources. Would you mind sharing a bit about your approach?"*

If you have ever tried to find a fully funded PhD or Master''s position, you know exactly what they mean. The data *is* everywhere. University websites are notoriously outdated, faculty pages haven''t been updated since 2019, and funding databases can feel like they require a degree in data science just to navigate.

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

> **Need help with your outreach?** Getting the email right is just as important as finding the professor. Use our [Cover Letters](/cover-letters) tool to draft the perfect cold email that gets replies.',
  'https://i.ibb.co/N2JwfNCx/grants-cover-image-1784978794123.jpg',
  'published',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_image_url = EXCLUDED.cover_image_url,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();
