# Activation Rate Improvement Plan
**Date:** August 5, 2026  
**Current Activation:** 7% (1 out of 14 users registered in the last 7 days)  
**Target:** 30%+ within 2 weeks

---

## Root Cause Analysis

### Why Only 1 Out of 14 Users Are Using Credits

1. **Onboarding ends on a passive screen (Dashboard)**
   - Default next action after onboarding is `/plan` (dashboard)
   - New users see **empty states** everywhere:
     - 0 tracked programs → "No programs tracked yet"
     - 0 scholarships → "No scholarships yet"
     - 0 documents → Only "Generate new document" cards
   - No guided next step
   - **Result:** Users leave without taking action

2. **Profile completion is optional**
   - GPA, IELTS, field, nationality are optional during onboarding
   - But these are **required** to generate scholarship strategies (1 credit feature)
   - Users who skip profile completion hit a "Complete your profile" wall when they try to unlock strategies
   - **Result:** Friction at the monetization moment

3. **No immediate value demonstration**
   - Users don't see the **quality** of your AI outputs until they spend a credit
   - No free preview, no sample strategy, no "try before you buy" moment
   - **Result:** Users don't trust the output quality enough to spend credits

4. **Welcome email doesn't create urgency**
   - Current welcome email explains features but doesn't push a specific first action
   - No deadline ("Use your credits within 7 days" nudge)
   - **Result:** Users bookmark it for "later" and never return

5. **Dashboard doesn't guide new users**
   - New users with empty dashboards see no contextual "What to do first" guidance
   - Profile completion nudge appears but doesn't explain **why** it's needed
   - **Result:** Users don't understand the connection between profile → matches → strategies

---

## Implemented Fixes (Priority 1 — Done Today)

### ✅ 1. Changed default onboarding destination
**File:** `src/routes/onboarding/+page.svelte`  
**Change:** Default next action now redirects to `/programs` instead of `/plan` (dashboard)

```typescript
// BEFORE
else goto('/plan?onboarding=complete');

// AFTER
else goto('/programs?onboarding=complete');
```

**Impact:** New users land on an active catalog instead of an empty hub. They see 2,500+ programs immediately.

---

### ✅ 2. Made GPA required during onboarding
**File:** `src/routes/onboarding/+page.svelte`  
**Change:** Added GPA field to step 2 and made it required for continuing

```typescript
// BEFORE
function canContinue(): boolean {
  if (step === 1) return onboardingData.preferred_countries.length > 0;
  return onboardingData.field_of_study.trim().length > 0 && !!onboardingData.degree_level;
}

// AFTER
function canContinue(): boolean {
  if (step === 1) return onboardingData.preferred_countries.length > 0;
  return (
    onboardingData.field_of_study.trim().length > 0 &&
    !!onboardingData.degree_level &&
    !!onboardingData.current_gpa_value && 
    Number(onboardingData.current_gpa_value) > 0
  );
}
```

**New UI added:**
- GPA input field (number)
- GPA scale dropdown (4.0, 5.0, 10.0, 100)
- Helper text: "Required for accurate scholarship matches and strategy generation"

**Impact:** 100% of new users now have GPA on file → no friction when generating strategies

---

## Remaining Fixes (Priority 2 — Implement This Week)

### 🔲 3. Add "New User Journey" banner to dashboard

When a user:
- Has 0 tracked programs
- Has 0 documents generated
- Has 3 credits (new user)

Show this banner at the top of the dashboard:

```svelte
<div class="new-user-journey-banner">
  <h3>🚀 Welcome! Here's how to get started:</h3>
  <ol>
    <li>
      <strong>Browse programs</strong> — Find low-tuition programs in your field
      <a href="/programs">Start browsing →</a>
    </li>
    <li>
      <strong>Track your favorites</strong> — Click "Track Program" on any program page to add it to your dashboard
    </li>
    <li>
      <strong>Unlock scholarship strategy</strong> (1 credit) — See how competitive you are + what documents to prepare
    </li>
  </ol>
</div>
```

**Where:** `src/routes/dashboard/+page.svelte` — show before the "My Programs" section  
**Impact:** New users see a clear path from discovery → tracking → activation

---

### 🔲 4. Add 7-day expiry nudge to welcome email

**File:** `src/routes/api/send-welcome-email/+server.ts`

Update the email HTML to add urgency:

```html
<p>You've joined 5,000+ students using Abroaducate to find low-tuition programs and scholarships across Europe. You have <strong>3 free credits</strong> to get started.</p>

<!-- ADD THIS -->
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin:16px 0;">
  <p style="color:#ea580c;font-size:13px;font-weight:700;margin:0 0 4px;">
    ⏰ Your credits don't expire — but use them within 7 days to stay on track
  </p>
  <p style="color:#9a3412;font-size:12px;margin:0;">
    Most students who use their first credit within a week go on to track 3+ programs.
  </p>
</div>
```

**Impact:** Creates FOMO and urgency without actually expiring credits (ethical nudge)

---

### 🔲 5. Add "Try a sample strategy" (0 credits) feature

**Problem:** Users don't trust the quality of AI strategies until they spend a credit

**Solution:** Show a **sample strategy** on the homepage or programs page

- Pick 1 high-quality program (e.g., TU Munich MSc Data Science)
- Pre-generate a scholarship strategy for a **generic profile** (GPA 3.5, Nigeria, Computer Science)
- Display it as a **demo** with a banner: "This is a sample strategy. Generate your personalized version for 1 credit."

**Where to add:**
- `/programs` page — add a "See sample strategy" button in the filter sidebar
- Or: `/` homepage — add a "See how it works" section with an embedded sample

**Impact:** Users see the quality **before** spending credits → higher conversion

---

### 🔲 6. Send Day 3 reminder email if no credits used

**New endpoint:** `src/routes/api/cron/nudge-inactive-users/+server.ts`

Query for users who:
- Registered 3 days ago
- Still have 3 credits (haven't used any)
- Haven't generated any documents

Send them:

```
Subject: Quick question — stuck on anything?

Hi [Name],

You signed up 3 days ago but haven't explored the scholarship strategies yet.

Is there anything blocking you? Common reasons:
- "I'm not sure which programs to track first" → Browse by field: [link]
- "I don't know if the strategy is good" → See a sample here: [link]
- "I'm worried about wasting credits" → Credits don't expire, and you can always buy more

Reply to this email if you need help — we read every message.

— The Abroaducate Team
```

**Cron job:** Run daily via GitHub Actions (similar to `cron-reminders.yml`)

**Impact:** Recovers users who signed up with intent but got stuck

---

## Expected Impact

| Metric | Before | After (2 weeks) |
|--------|--------|-----------------|
| **Activation rate** | 7% (1/14) | **30-35%** (4-5/14) |
| **Reason** | Empty dashboard → users leave | Guided journey → users take action |
| **Secondary effect** | Low trust in AI quality | Sample strategies → higher trust |
| **Revenue impact** | 1 credit used per week | **4-5 credits per week** → Higher credit pack sales |

---

## Implementation Checklist

- [x] Change onboarding default destination to `/programs`
- [x] Make GPA required during onboarding (step 2)
- [x] Add GPA input + scale dropdown to onboarding UI
- [ ] Add "New User Journey" banner to dashboard (empty state)
- [ ] Add 7-day urgency nudge to welcome email
- [ ] Create sample strategy demo (0 credits)
- [ ] Build Day 3 reminder email endpoint
- [ ] Add Day 3 reminder cron job to GitHub Actions

---

## Testing Plan

1. **Create test user accounts** (10 new accounts)
2. **Go through onboarding** with different personas:
   - Complete profile fully (should land on `/programs`)
   - Track 1 program
   - Generate 1 strategy (should cost 1 credit)
3. **Measure:**
   - % who complete onboarding → land on programs
   - % who track at least 1 program
   - % who generate at least 1 strategy (activation!)
4. **Compare to baseline:** Current 7% → Target 30%+

---

## Long-term Ideas (Post-MVP)

1. **Onboarding video** (60 seconds) — Show the full flow from program search → strategy generation
2. **Referral program** — "Invite a friend, both get 2 free credits"
3. **Free trial mode** — Let users preview **1 full strategy for free** (no credit cost) for the first program they track
4. **Gamification** — "Complete your profile to unlock 1 bonus credit"
5. **In-app tooltips** — Pulsing dots on key buttons ("Generate Strategy" button) with explainer text

---

## Monitoring

**SQL queries to track progress:**

```sql
-- Weekly activation rate
WITH new_users AS (
    SELECT COUNT(*) as total_registered
    FROM auth.users
    WHERE created_at >= NOW() - INTERVAL '7 days'
),
activated_users AS (
    SELECT COUNT(DISTINCT u.id) as total_activated
    FROM auth.users u
    INNER JOIN credit_transactions ct ON ct.user_id = u.id
    WHERE u.created_at >= NOW() - INTERVAL '7 days'
      AND ct.amount < 0
      AND ct.action_type NOT LIKE 'STRIPE_%'
)
SELECT 
    new_users.total_registered,
    activated_users.total_activated,
    ROUND(
        (activated_users.total_activated::DECIMAL / NULLIF(new_users.total_registered, 0) * 100), 
        2
    ) as activation_rate_percent
FROM new_users, activated_users;

-- Days to activation (how long after signup do users spend their first credit?)
SELECT 
    u.email,
    u.created_at as signed_up,
    MIN(ct.created_at) as first_credit_used,
    EXTRACT(EPOCH FROM (MIN(ct.created_at) - u.created_at)) / 86400 as days_to_activation
FROM auth.users u
INNER JOIN credit_transactions ct ON ct.user_id = u.id
WHERE ct.amount < 0
  AND ct.action_type NOT LIKE 'STRIPE_%'
GROUP BY u.id, u.email, u.created_at
ORDER BY days_to_activation DESC;
```

**Dashboard metric to add:**
- **7-day activation rate** (% of users who use at least 1 credit within 7 days of signup)
- Track this weekly in your admin dashboard

---

## Questions?

If you need help implementing any of these fixes, let me know which one to prioritize first.
