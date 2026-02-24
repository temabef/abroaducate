# Email system: audit, configuration & activation

This doc answers: what is configured, what is not working until you pay for SendGrid, how the two audiences work, Stripe vs you, and exactly what to do before and after you pay.

---

## Email workflow summary (what we have)

| Audience | What they get | Frequency | Trigger |
|----------|----------------|-----------|---------|
| **Registered users** (auth) | Scholarship digest (curated new scholarships) | **Weekly** (Mondays) | Cron: `user_preferences.scholarship_digest_weekly`; free = weekly only, paid = weekly or daily |
| **Newsletter subscribers** (~8k) | Same scholarship digest | **Bi-weekly** (every 14 days) or weekly/monthly | Cron: when `newsletter_enabled` + `scholarship_digest_enabled`; frequency from `newsletter_settings.send_frequency` (`weekly`, `bi-weekly`, `monthly`) |
| **Registered (paid)** | Application deadline reminders, subscription/trial alerts | As deadlines approach / 7–3–1 days before expiry | Same cron |

**Digest content:** Up to **15** scholarships from the **last 14 days** (newest first), from the `scholarships` table. Same list for everyone; no per-user filtering in the digest.

**Where the email is designed:** In code only — `src/routes/api/cron/send-reminders/+server.ts`: `generateScholarshipDigestHTML()` and `generateScholarshipDigestText()`. Template is inline HTML (title, provider, amount, deadline, link to `/scholarships/{id}`). To change design: edit that file, or later add admin-editable templates (e.g. in DB or CMS).

**Cron:** GitHub Actions runs daily at 9:00 UTC; the handler decides who gets digest today (Monday for registered weekly; every 14+ days for newsletter bi-weekly).

---

## 1. Current state (audit)

### 1.1 What is already built

| Piece | Status | Where |
|-------|--------|--------|
| **SendGrid dependency** | ✅ In use | `@sendgrid/mail` in `package.json` |
| **Newsletter DB** | ✅ Migrated | `newsletter_subscribers`, `newsletter_campaigns`, `newsletter_email_logs`, `newsletter_settings` (Supabase) |
| **Admin UI** | ✅ Working | `/admin/newsletter` – compose, batch send, test SendGrid, analytics, subscriber list |
| **Batch send API** | ✅ Working | `POST /api/newsletter/batch-send` – sends to active `newsletter_subscribers` in batches |
| **Test SendGrid** | ✅ Working | `GET /api/newsletter/test-sendgrid` – sends one test email to logged-in admin |
| **Contact support** | ✅ Working | `POST /api/contact-support` – uses SendGrid to send to you + auto-reply |
| **Cron reminders** | ✅ Implemented | `POST /api/cron/send-reminders` – scholarship digest, application reminders, trial/subscription alerts for **registered users** (needs `CRON_SECRET` + `SENDGRID_API_KEY`) |
| **Email reminders (user-triggered)** | ✅ Working | `POST /api/email-reminders` – per-user reminder emails (respects preferences) |

So: **code and DB are in place. Nothing sends until `SENDGRID_API_KEY` is set and you have a paid SendGrid plan** (free tier is 100/day, not enough for 12k people).

### 1.2 Environment variables required

All of these are read by the app; **none are in `.env.example` yet** (see Section 5 for adding them).

| Variable | Required | Used by | Notes |
|----------|----------|--------|--------|
| **SENDGRID_API_KEY** | ✅ Yes (for sending) | Newsletter, contact, cron, test-email | Create in SendGrid Dashboard → API Keys |
| **FROM_EMAIL** | ✅ Yes | All SendGrid sends | e.g. `hello@abroaducate.com` – **must be verified in SendGrid** (single sender or domain) |
| **FROM_NAME** | Optional | All SendGrid sends | Defaults to `Abroaducate` |
| **SENDGRID_FROM_EMAIL** | Optional | Newsletter test/batch | Fallback if `FROM_EMAIL` not set; otherwise same as `FROM_EMAIL` |
| **CRON_SECRET** | ✅ Yes (for cron) | `/api/cron/send-reminders` | Secret token; caller must send `Authorization: Bearer <CRON_SECRET>` |

- **Vercel:** set these in Project → Settings → Environment Variables (Production, Preview if you want).
- **Local:** add to `.env` (do not commit `.env`).

### 1.3 Why emails are “not working”

- **SendGrid API key** is missing or free tier only → no sending, or 100/day limit.
- **FROM_EMAIL** not set or not verified in SendGrid → sends fail or get blocked.
- **Cron** for reminders is already scheduled: a **GitHub Actions workflow** (`.github/workflows/cron-reminders.yml`) runs daily at 9:00 UTC and calls `POST /api/cron/send-reminders` with `Authorization: Bearer <CRON_SECRET>`. You must set **CRON_SECRET** in the repo’s GitHub Actions secrets so the workflow can authenticate.

So: **pay for SendGrid, add and verify the sender, set env vars, then everything that uses SendGrid can start working.**

---

## 2. Your two audiences (~12k total)

### 2.1 Newsletter subscribers (~8,000)

- **Table:** `newsletter_subscribers`
- **Who:** Imported leads (e.g. 8k), plus anyone who signed up via the site (source: e.g. `website`, `ebook_*`, `marketing`).
- **Used by:** `/admin/newsletter` and `POST /api/newsletter/batch-send`.
- **Sending:** You (or an admin) compose a campaign and send in batches to `status = 'active'`. No automatic sends to this list unless you add a scheduled job that builds a campaign and calls batch-send (or a dedicated digest endpoint).

So: **these 8k are for manual or scheduled campaigns from the admin panel**, not for Stripe.

### 2.2 Registered users (~4,000)

- **Source:** `auth.users` (Supabase Auth). Optionally preferences in `user_preferences` (e.g. `scholarship_digest_weekly`, `scholarship_digest_daily`).
- **Used by:**  
  - **Cron:** `POST /api/cron/send-reminders` sends scholarship digest, application reminders, subscription/trial alerts to registered users who have preferences / subscription state.  
  - **User-triggered:** `POST /api/email-reminders` for reminder emails (e.g. deadline reminders).
- **Overlap:** If someone is both in `newsletter_subscribers` and in `auth.users`, they can get (1) newsletter campaigns from the 8k list and (2) digest/reminders as a registered user. Your docs mention marking `converted_to_user` and optionally deduplicating or segmenting so you don’t double-email; that’s a content/segment choice, not a code bug.

So: **~8k = newsletter list (admin-driven campaigns). ~4k = registered users (digest + reminders + transactional). Total ~12k reachable; some may be in both.**

---

## 3. Who sends what: Stripe vs Abroaducate

- **Stripe** sends **billing/payment emails** (receipts, failed payment, subscription renewed, etc.). You do **not** need to send those yourself; Stripe does it when you use Stripe Billing/Checkout. You can customize some of that in Stripe Dashboard (e.g. branding, support email).
- **Abroaducate (you)** send:
  - **Newsletter / marketing:** campaigns from `/admin/newsletter` to `newsletter_subscribers`.
  - **Transactional / product:** contact form replies, test emails, and anything from your app (reminders, digest, trial/subscription *reminder* emails from your cron).
  - **Digest and reminders:** via `/api/cron/send-reminders` for registered users (scholarship digest, application deadlines, “your trial ends in X days”), and any one-off reminder flows that call `email-reminders` or similar.

So: **subscription/billing emails = Stripe. Everything else (newsletter, digest, reminders, contact) = your SendGrid.**

---

## 4. SendGrid plan and sending limits

- **Free:** 100 emails/day → not enough for 12k people.
- **Essentials (e.g. ~$19.95/mo):** Often 50,000 emails/month. Enough for:
  - ~12k people × 1–4 emails/month = 12k–48k/month (e.g. weekly digest + 1–2 campaigns), or
  - Fewer people with more frequent emails.
- **Pro and above:** Higher volume if you grow.

**Recommendation:** Start with the **paid plan you’re considering (e.g. Essentials)**. Before paying: (1) verify sender (see below), (2) set env vars, (3) run the test send. After paying, you’re just under the same config; no code change needed.

**Domain / sender verification (required):** In SendGrid, add and verify either a **Single Sender** (e.g. `hello@abroaducate.com`) or **Domain Authentication** for `abroaducate.com`. Until one of these is verified, SendGrid may block or reject sends. Use that verified address as `FROM_EMAIL`.

---

## 5. What to do before you pay (setup so it’s ready)

### Step 1: SendGrid account and sender

1. Sign up / log in at [SendGrid](https://sendgrid.com).
2. Create an **API Key** (Dashboard → API Keys) with “Mail Send” (and optionally “Mail Send – Scheduled” if you use scheduling). Copy the key once; you’ll put it in `SENDGRID_API_KEY`.
3. Add and verify the sender:
   - **Single Sender Verification:** add `hello@abroaducate.com` (or your chosen address) and complete the verification email.
   - Or **Domain Authentication:** add `abroaducate.com` and add the DNS records SendGrid gives you.
4. After you **pay for the plan** (e.g. Essentials), your sending limit increases; no extra config.

### Step 2: Environment variables

In **Vercel** (and optionally locally in `.env`):

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=hello@abroaducate.com
FROM_NAME=Abroaducate
CRON_SECRET=your-random-secret-for-cron
```

- Use a long random string for `CRON_SECRET` (e.g. `openssl rand -hex 32`).
- Redeploy after setting env vars so the server sees them.

### Step 3: Verify configuration (before paying is fine for a test)

1. Log in as an admin.
2. Go to **`/admin/newsletter`**.
3. Click **“Test SendGrid Configuration”** (or call `GET /api/newsletter/test-sendgrid`).  
   - If `SENDGRID_API_KEY` is missing → you’ll get a clear error.  
   - If the key is set but the sender is not verified → SendGrid will reject the test send; fix verification then retry.  
   - If the test succeeds → you’re ready; after you pay, the same key will work for full volume.

### Step 4: After you pay

- No code or env changes needed.
- Send a small batch from `/admin/newsletter` (e.g. “Send to first 50”) to confirm.
- Then decide frequency and content (Section 6).

---

## 6. Frequency and types of emails (don’t bombard)

Recommended approach: **one main rhythm + a few clear types**, so people know what to expect and don’t unsubscribe.

### 6.1 Newsletter list (~8k)

- **Weekly digest (e.g. Mondays):** One “top scholarships / study abroad tips” email per week.  
  - Implement by: a cron (or Vercel Cron) that builds a campaign and calls your batch-send or a dedicated “weekly digest” endpoint, or you send manually from `/admin/newsletter` once a week.
- **Occasional campaigns:** 1–2 extra emails per month (e.g. “New feature”, “Application deadline reminder”), not daily.
- **Avoid:** Daily blasts to the whole list; that will hurt deliverability and unsubscribes.

So: **max ~4–6 emails per month per subscriber** for the newsletter list is a safe target.

### 6.2 Registered users (~4k)

- **Scholarship digest:** Already supported by cron; respect `user_preferences` (e.g. weekly vs daily). Recommend **weekly** as default; daily only for paid tiers if you want.
- **Application/deadline reminders:** From cron; keep to a few per week per user (e.g. “3 deadlines in the next 7 days”).
- **Subscription/trial alerts:** From cron (e.g. “Trial ends in 3 days”); these are transactional and expected.
- **Marketing to registered users:** If you add a “newsletter” segment for users, treat like the 8k list: weekly or a few per month, not daily.

So: **digest weekly (or daily for premium only), reminders as needed, plus Stripe for billing.**

### 6.3 Summary

| Audience | Suggested max frequency | Types |
|----------|--------------------------|--------|
| Newsletter (8k) | Weekly digest + 1–2 campaigns/month | Digest, study tips, soft promo |
| Registered (4k) | Weekly digest (or daily for paid) + reminders | Digest, deadlines, trial/subscription reminders |
| Stripe | N/A (Stripe sends) | Receipts, failed payment, renewal |

---

## 7. Cron: reminder/digest job (already set up with GitHub Actions)

The endpoint **`POST /api/cron/send-reminders`** does:

- Scholarship digest (by user preference)
- Application reminders
- Subscription/trial alerts
- (And can be extended for more types.)

**You already have a cron schedule:** a GitHub Actions workflow runs it every day. Details:

- **File (GitHub Actions):** See `.github/workflows/cron-reminders.yml`; no vercel.json cron needed that calls this URL with the secret (e.g. via serverless function that adds the header). You can start with once per day (e.g. 9:00 UTC); then adjust logic inside the handler for “only Mondays” for weekly digest if needed.
Once `CRON_SECRET` is set in GitHub, the workflow will call the endpoint daily; no other cron setup needed.

---

## 8. Quick checklist before / after you pay

**Before paying:**

- [ ] SendGrid account created.
- [ ] Sender (e.g. `hello@abroaducate.com`) or domain verified in SendGrid.
- [ ] `SENDGRID_API_KEY`, `FROM_EMAIL`, `FROM_NAME`, `CRON_SECRET` set in Vercel (and redeployed).
- [ ] “Test SendGrid Configuration” on `/admin/newsletter` succeeds (or fix verification and retry).

**After paying:**

- [ ] Same API key; no code change.
- [ ] Send one small batch from `/admin/newsletter` to confirm.
- [ ] Ensure `CRON_SECRET` is set in **GitHub Actions** repo secrets (same value as in Vercel) so the existing daily workflow (9:00 UTC) can call the endpoint.
- [ ] Decide: weekly (or daily for paid) digest + 1–2 campaigns/month for the 8k list; stick to that so you don’t bombard.

---

## 9. File reference

| Purpose | File / route |
|--------|----------------|
| Newsletter admin UI | `src/routes/admin/newsletter/+page.svelte` |
| Batch send (newsletter) | `src/routes/api/newsletter/batch-send/+server.ts` |
| Test SendGrid | `src/routes/api/newsletter/test-sendgrid/+server.ts` |
| Cron reminders (digest, app reminders, subscription) | `src/routes/api/cron/send-reminders/+server.ts` |
| GitHub Actions cron (daily 9:00 UTC) | `.github/workflows/cron-reminders.yml` |
| Contact form | `src/routes/api/contact-support/+server.ts` |
| User-triggered reminders | `src/routes/api/email-reminders/+server.ts` |
| Newsletter DB schema | `supabase/migrations/20240101000010_newsletter_system.sql` |
| Env example (to update) | `.env.example` |

---

**Summary:** The email system is implemented and wired to SendGrid and your DB. A **GitHub Actions workflow** already runs the reminder/digest cron daily at 9:00 UTC. Set `SENDGRID_API_KEY` and `FROM_EMAIL` (verified in SendGrid), set `CRON_SECRET` in both Vercel and GitHub Actions secrets, run the test send, then pay for SendGrid. After paying, the same config works and the existing cron will send digest/reminders to registered users; keep newsletter frequency to weekly (+ 1–2 campaigns/month) for the 8k list so you don’t bombard anyone.
