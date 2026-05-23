# Pre-Deploy QA Checklist

_Complete all items before pushing to production._
_Payment: Stripe only at launch. Paddle and Paystack are post-launch._

---

## Step 1 — Get program IDs for tests

Run this SQL in Supabase SQL Editor and paste the IDs into the test files:

```sql
-- Programs with matches (for scholarship-matches.test.ts)
SELECT p.id, p.program_name, p.country, COUNT(m.id) as match_count
FROM programs p
LEFT JOIN program_scholarship_matches m ON m.program_id = p.id
WHERE p.country IN ('Germany', 'France', 'Poland', 'Sweden', 'Austria')
GROUP BY p.id, p.program_name, p.country
HAVING COUNT(m.id) > 0
ORDER BY p.country, match_count DESC
LIMIT 5;

-- Programs with 0 matches (for funding-guidance.test.ts)
SELECT p.id, p.program_name, p.country
FROM programs p
LEFT JOIN program_scholarship_matches m ON m.program_id = p.id
WHERE p.country IN ('Lithuania', 'Czechia', 'Estonia')
GROUP BY p.id, p.program_name, p.country
HAVING COUNT(m.id) = 0
LIMIT 3;
```

Paste the IDs into:
- `tests/e2e/funding-guidance.test.ts` → `SAMPLE_PROGRAMS`
- `tests/e2e/scholarship-matches.test.ts` → `SAMPLE_PROGRAMS_WITH_MATCHES`

---

## Step 2 — Run automated tests

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

All tests should pass before proceeding.

---

## Step 3 — Manual: Full credit flow (Stripe)

Requires: dev server running, Stripe test mode keys in `.env`

- [ ] Go to `/register` → create a new test account
- [ ] Complete onboarding
- [ ] Go to `/programs` → find a program → click "Track"
- [ ] Go to `/dashboard` → open the tracked program
- [ ] Click "Start Strategy & AI Fit Check" → confirm credit is deducted (3 → 2)
- [ ] Generate SOP → confirm credit deducted (2 → 1)
- [ ] Generate again → confirm credit deducted (1 → 0)
- [ ] Try to generate again → confirm 402 / upgrade prompt appears
- [ ] Go to `/pricing` → click "Buy" on the 20-credit pack
- [ ] Complete Stripe test checkout (use card `4242 4242 4242 4242`, any future date, any CVC)
- [ ] Confirm redirect back to `/dashboard?payment=success`
- [ ] Confirm credit balance is now 20
- [ ] Generate SOP again → confirm it works and credit deducted (20 → 19)

**Stripe test cards:** https://stripe.com/docs/testing#cards

---

## Step 4 — Manual: Email templates

Requires: Customer.io configured, `hello@abroaducate.com` inbox accessible

- [ ] **Welcome email** — register a new account → check inbox for welcome email within 2 minutes
- [ ] **Credit low warning** — spend credits down to 1 → check inbox for low-credit warning
- [ ] **Scholarship digest** — trigger manually via `/api/cron/weekly-scholarships` (POST with cron secret) → check a test subscriber inbox
- [ ] **Deadline reminder** — trigger manually via `/api/cron/send-reminders` → check a test subscriber inbox

To trigger cron emails manually:
```bash
# Replace YOUR_CRON_SECRET with the value from your .env
curl -X POST http://localhost:5173/api/cron/weekly-scholarships \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST http://localhost:5173/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Step 5 — Manual: FundingGuidance spot check

With the dev server running, visit one program from each of these countries and confirm the FundingGuidance panel renders with the correct country-specific content:

- [ ] Lithuania — should show "How Master's funding works in Lithuania" + Stefan Banach / EUROSTIPENDIUM tips
- [ ] Czechia — should show "How Master's funding works in Czechia" + Czech Government Scholarships / DZS tips
- [ ] Estonia — should show "How Master's funding works in Estonia" + Archimedes Foundation / Study in Estonia tips
- [ ] All three: "Browse all scholarships in our catalog" link is present and goes to `/scholarships`
- [ ] All three: No JS errors in browser console

---

## Step 6 — Final checks before deploy

- [ ] `npm run build` completes without errors
- [ ] `npm run check` (svelte-check) shows 0 errors
- [ ] All automated tests pass (`npm run test:e2e`)
- [ ] Run `scripts/post-deploy-credits.mjs --dry-run` and review output
- [ ] Verify Faith Rotich (`mouzesrotich@gmail.com`) will receive 500 credits in the dry-run output
- [ ] Confirm Stripe webhook secret is set in production environment
- [ ] Confirm `CUSTOMER_IO_API_KEY` is set in production environment
- [ ] Confirm no Paddle or Paystack keys are present (not needed at launch)

---

## Post-launch (separate checklist — do not block deploy on these)

- [ ] Blog redesign: `/blog` and `/blog/[slug]` — update to new platform design (orange accent, Outfit font, Lucide icons, updated sidebar links)
- [ ] Paddle re-application: reapply with new platform's software-only offering, then wire sandbox → test → live
- [ ] Scholarship catalog growth: add Czechia, Lithuania, Estonia scholarships to reach 1,000+
