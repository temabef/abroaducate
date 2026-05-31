# Abroaducate — Week 1 Launch Report
_Period: 23 May – 30 May 2026_

---

## Overview

Week 1 of the new Abroaducate platform. The old platform remained live at abroaducate.com throughout the week while the rebuild was deployed. This report covers platform performance, product fixes, content output, and community engagement for the first 7 days post-launch.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| Total sessions | 3,914 |
| Unique users | 2,678 |
| New users | 2,409 |
| New signups (registered accounts) | 123 |
| Activated users (spent at least 1 credit) | 3 |
| Activation rate | 2.4% |
| Credits spent — Scholarship Strategy | 15 |
| Credits spent — SOP Generation | 1 |
| Paying customers | 0 (2 test purchases by founder, refunded) |
| Newsletter → platform conversions | 16 out of ~8,000 subscribers (0.2%) |

### Top Landing Pages (Week 1)

| Page | Sessions |
|------|----------|
| / (Homepage) | 927 |
| /scholarships | 450 |
| /blog/free-universities-germany-no-ielts-2026 | 224 |
| /scholarships/[individual pages] | ~250 combined |
| /how-to-study-free-europe-ultimate-guide | 62 |
| /top-uk-universities-that-accept-lower-grade | 50 |

### Traffic Sources
- Launch day (23 May) saw a spike to 108 homepage sessions vs expected 13
- Direct traffic: 7 → 68 (week over week)
- Organic Social: 5 → 28
- Blog article on Germany/IELTS ranked and drove 224 sessions in its first week

---

## Product Fixes & Improvements

### Critical Bug Fixes
- **SOP generation 404** — The `/submit-sop` route was missing. Every user who completed the SOP form and clicked Generate hit a 404 page. Fixed by creating the missing route with a loading screen and proper redirect to `/sop/[id]`.
- **Cover letter 404** — Same pattern. `/submit-cover-letter` route was missing. Fixed.
- **Personal statement 404** — Same pattern. `/submit-personal-statement` route was missing. Fixed. (Personal statement also required a two-step generate + save flow since the API didn't return an ID.)
- Academic CV was unaffected — it used an inline fetch pattern.

### Performance & Egress Optimisation
Supabase egress exceeded the free tier limit (6.891 GB / 5 GB, 138%) due to `SELECT *` queries loading all data on every page visit.

Fixes applied across all major pages:

| Page | Before | After |
|------|--------|-------|
| /programs | All 2,597 rows, SELECT *, no cache | 30 rows per page, 20 columns, 5-min CDN cache |
| /scholarships | All 727 rows, SELECT *, no cache | All rows, 16 columns, 5-min cache |
| /programs/[id] | SELECT *, no cache | 22 columns, 10-min cache |
| /universities | SELECT *, no cache | 11 columns, 10-min cache |
| /universities/[id] | SELECT * on both tables, no cache | Explicit columns, 10-min cache |

Estimated egress reduction: ~95% on the programs page, ~70-80% across all pages combined.

### Admin Scholarships Page Redesign
- Replaced flat list with 3-column card grid matching the public scholarship discovery page
- Added sidebar search with database-wide search (previously only searched current page)
- Fixed HTML entity decoding so scholarship titles display correctly
- Fixed ordering to match public page (created_at + id DESC for deterministic sort)

### Scholarship Discovery Page
- Added left sidebar with 5 filter groups: Type, Level, Country, Field, Funding Type
- Mobile filter drawer added
- Items per page reduced from 12 to 9 to fit sidebar layout

### Programs Page
- Migrated from client-side filtering of all 2,597 programs to server-side pagination (30 per page)
- Filters now run on the database via URL query params
- Page load time reduced from ~8-10 seconds to near-instant

### Blog
- Blog post design updated and deployed
- Fixed related articles showing wrong posts (WordPress-era posts were leaking into the new blog's related section)
- Fixed table of contents not updating when navigating between posts
- Fixed blog posts defaulting to the latest post regardless of URL

### RSS Feeds
- Built `/rss/scholarships.xml` and `/rss/programs.xml` endpoints
- Connected to Make.com → Telegram channel automation (new scholarships auto-post to Telegram)
- RSS description updated: removed emojis, fixed level separator, changed apply link to platform URL

### Pricing Page
- Added sample AI Fit Check output section showing a realistic strategy result
- Added free trial CTA at the bottom of the page

### Data Fixes
- Fixed negative `living_cost_per_month` values on Portugal and Poland programs (were showing €-50, €-125, €-600)
- Updated to realistic city-based estimates (Aveiro €600, Lisbon €800, Warsaw €700)

---

## Content Published

### Blog Posts
- "Free Universities in Germany for International Students Without IELTS (2026)" — 224 sessions in first week, ranking for long-tail keywords

### Social Media Posts (X/Twitter)
- Germany free programs thread (10 tweets)
- France free programs thread
- Erasmus Mundus breakdown thread (7 tweets)
- "Why I built Abroaducate" founder story thread
- CV vs Europass thread
- MEXT Japan scholarship thread
- SOP review prompt thread
- Multiple single tweets (scholarship facts, myth-busting, engagement posts)

### LinkedIn Posts
- Germany free programs
- France free programs
- Why I built Abroaducate
- Europass vs US Resume
- SOP review prompt
- Multiple short-form posts

---

## Community & Outreach

### DM Replies
- Approximately 30 DMs replied across Twitter/X and LinkedIn
- Topics covered: Germany/Europe programs, DAAD, Erasmus Mundus, US visa restrictions, scholarship application order, CV advice, PhD positions, field-specific program recommendations
- Platform links included in relevant replies

### Email Replies
- Replied to 5 emails from the launch broadcast ("I built this for you")
- Emailed `mariamsanusi324@gmail.com` personally after identifying via PostHog that she spent 30 minutes on the SOP form and hit the 404 bug
- Emailed the 3 users who spent credits asking for feedback (no replies yet)
- Sent activation nudge to 113 inactive signups (batched due to Zoho free tier BCC limit)

### F6S Listing
- Submitted Abroaducate to F6S.com free software directory
- Listed 20 free credits as the deal offer
- Awaiting approval

---

## What Didn't Work

- **Activation rate (2.4%)** — 120 of 123 signups never used a credit. The SOP 404 bug likely contributed. Onboarding clarity is the next thing to investigate via PostHog session recordings.
- **Newsletter conversion (0.2%)** — Only 16 of 8,000 subscribers registered. The launch email may not have created enough urgency or the value proposition wasn't clear enough for the existing audience.
- **No revenue** — Expected in week 1 with a free credit model, but the activation gap means the path to revenue is blocked until more users actually try the product.

---

## What Worked

- Blog SEO is working faster than expected — 224 sessions on the Germany/IELTS article in week 1
- Social media engagement is real — posts getting replies, saves, and DMs
- The platform itself is stable — no major downtime, build passes
- Scholarship strategy feature is the most-used feature (15 uses vs 1 SOP) — this is the angle to lead with in marketing

---

## Week 2 Priorities

1. Watch PostHog session recordings for new users — find where they drop off
2. Monitor activation nudge email responses
3. Publish second blog article ("Tuition-free universities in Germany 2026")
4. Continue daily social posting
5. Reply to all outstanding DMs
6. Check if F6S listing gets approved
7. Monitor Supabase egress — confirm it stabilises after the optimisation fixes





---

## Weekly Content Generation Prompt

Use this prompt each week to generate a full week of social media content. Paste it into any AI chat (this one or another) and it will produce a balanced mix of threads and single posts.

---

```
You are writing social media content for Abroaducate — a platform that helps African and international students find free and affordable university programs in Europe, match with scholarships, and generate AI-powered application documents (SOP, Cover Letter, Personal Statement).

Platform: abroaducate.com
Founder: Sola (Nigerian, studying abroad, built the platform in 6 months)
Audience: African students (primarily Nigerian, Ghanaian, Kenyan) applying to European universities
Tone: Informal, direct, helpful. Like a knowledgeable older brother. No em dashes. No excessive emojis. No hype.

Platform facts to reference:
- 2,597 programs across 10 European countries (Germany, France, Italy, Poland, Lithuania, Estonia, Austria, Czechia, Sweden, Portugal)
- 679 scholarships matched to specific programs
- AI Fit Check (1 credit), SOP (2 credits), Cover Letter (2 credits), Personal Statement (2 credits)
- 3 free credits on signup, no card required
- Credits never expire — pay-as-you-go: 20/$4.99, 50/$9.99, 130/$24.99
- Germany: €0 tuition at public universities
- France: ~€243/year tuition
- Scholarship Radar on each program page shows matched scholarships

Generate a full week of content (7 days) with this daily structure:
- 3 days: X/Twitter THREAD (5-7 tweets, first tweet is the hook, last tweet has a soft CTA to abroaducate.com)
- 4 days: X/Twitter SINGLE TWEET (under 280 characters, punchy, no CTA needed)
- Each day also gets a LinkedIn version (same topic, adapted for LinkedIn format — single post, 150-250 words, ends with a repost CTA)

Topics to rotate through each week (pick 7, don't repeat from last week):
- Country spotlight: free/cheap programs in a specific country (Germany, France, Poland, Italy, Sweden, Austria, Portugal)
- Scholarship spotlight: one specific scholarship explained simply (DAAD, Erasmus Mundus, Heinrich Böll, Eiffel, Swedish Institute, MEXT, Chevening)
- Myth-busting: a common misconception about studying abroad
- Process/how-to: one step in the application process explained clearly
- Data-driven: a stat or insight from the platform's 679 scholarships or 2,597 programs
- Founder story: a personal angle from Sola's experience
- Engagement: a question that invites replies (no CTA, just conversation)

Avoid topics already covered this week: [INSERT LAST WEEK'S TOPICS HERE]

Format the output as:
Day 1 — [Topic]
X Thread: [tweet 1] / [tweet 2] / ... / [last tweet]
LinkedIn: [post]

Day 2 — [Topic]
X Single Tweet: [tweet]
LinkedIn: [post]

...and so on for all 7 days.
```

---

**How to use it:**

1. At the start of each week, paste the prompt into a new chat
2. Fill in "Avoid topics already covered this week" with last week's topics from this report
3. Review the output, swap any topics that feel repetitive
4. Batch-schedule the posts using Buffer or post manually each morning
5. Save the generated posts in a new file: `docs/WEEK[N]_CONTENT_[DATE].md`
