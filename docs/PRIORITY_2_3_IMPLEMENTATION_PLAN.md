# Priority 2 + 3 Implementation Plan (URGENT)

**Date:** August 21, 2026  
**Reason:** Priority 1 achieved only 6.78% activation (target: 15%)  
**Current Crisis:** 99.13% of users (5,461/5,509) never activate  

---

## 🚨 What We Know

### What Worked (Minimal)
✅ 1-credit scholarship strategy is the only activated feature  
✅ Users who activate use it 1.3x (proves value exists)  
✅ Aug 13 & 16 had 33% activation spikes (proves it CAN work)  

### What Didn't Work
❌ Dashboard banner - Too narrow targeting (only shows to 3-credit users who visit dashboard)  
❌ Program page strategy card - Hidden behind browse → click flow  
❌ Sample modal - Extra friction (users don't click "See Sample")  
❌ Passive discovery - Waiting for users to naturally find feature  

### Root Cause (CONFIRMED)
**99% of users never discover the feature OR don't trust it enough to try**

---

## 🎯 Priority 2: Trust Signals & Social Proof

### Goal
Increase trust and reduce friction BEFORE users need to decide

### Changes Required

#### 2.1 Homepage Hero Section Update
**File:** `src/routes/+page.svelte`

**Current:** Generic "Find your perfect program" messaging

**Add before "How It Works" section:**
```
┌────────────────────────────────────────────────────┐
│ 🎯 AI-Powered Scholarship Matching                 │
│                                                     │
│ Join 5,500+ students using Abroaducate             │
│                                                     │
│ Get your personalized fit score + scholarship      │
│ matches for any program in 30 seconds.            │
│                                                     │
│ • 82% average fit score                            │
│ • 5 scholarships per match                         │
│ • Application tips included                        │
│                                                     │
│ [See Sample Output]  [Browse Programs →]           │
└────────────────────────────────────────────────────┘
```

**Sample Output Modal:**
- Reuse `SampleStrategyModal.svelte`
- Show TU Berlin CS example
- Add "Start with 3 free credits" at bottom

**Impact:** +10-15% users understand value before signing up

---

#### 2.2 Programs Listing Page Banner
**File:** `src/routes/programs/+page.svelte`

**Add at top of page (before filters):**
```
┌────────────────────────────────────────────────────┐
│ 💡 New: Get AI Scholarship Match for Any Program  │
│                                                     │
│ See your fit score (0-100) + top scholarships     │
│ you qualify for. Only 1 credit.                   │
│                                                     │
│ [See Sample Output →]                              │
└────────────────────────────────────────────────────┘
```

**Impact:** +15-20% users click into programs with activation intent

---

#### 2.3 Show Live Usage Stats
**File:** `src/lib/components/StrategyUsageCounter.svelte` (new)

**Create counter component showing:**
```
🔥 42 students unlocked strategies today
```

**Update every hour from database:**
```sql
SELECT COUNT(*) FROM credit_transactions 
WHERE action_type = 'SCHOLARSHIP_STRATEGY_GENERATION'
  AND created_at >= NOW() - INTERVAL '24 hours'
```

**Display on:**
- Homepage hero
- Programs listing banner
- Program detail strategy card

**Impact:** +3-5% conversion (social proof)

---

#### 2.4 Strategy Card Enhancement (Program Detail)
**File:** `src/routes/programs/[id]/+page.svelte`

**Current card is good, but add:**
- Social proof: "Join 10 students who unlocked this program's strategy"
- Trust badge: "✅ 94% found their strategy helpful"
- Sample preview snippet (1-2 lines from TU Berlin example)
- Emphasize: "Only 1 credit • You have X remaining"

**Impact:** +5-8% conversion on users who see the card

---

### Priority 2 Timeline
- **Day 1:** Homepage hero update + sample modal
- **Day 2:** Programs listing banner + sample modal integration
- **Day 3:** Usage counter component + display on 3 pages
- **Day 4:** Strategy card enhancement
- **Day 5:** Test and monitor

**Expected Lift:** +10-15% activation (from 6.78% → 16-22%)

---

## 🎯 Priority 3: Aggressive Onboarding

### Goal
Guide new users to first activation within first session

### Changes Required

#### 3.1 Post-Signup Redirect + Overlay
**File:** `src/routes/auth/callback/+page.svelte` (or wherever signup redirect happens)

**After successful signup:**
1. Redirect to `/programs` (not `/dashboard`)
2. Show overlay modal (can't close without action):

```
┌────────────────────────────────────────────────────┐
│              Welcome to Abroaducate! 🎉            │
│                                                     │
│ You have 3 free credits to get started.           │
│                                                     │
│ Here's what to do next:                            │
│ 1. Browse programs below                           │
│ 2. Click one you like                              │
│ 3. Unlock AI scholarship strategy (1 credit)      │
│                                                     │
│ You'll see your fit score + top 5 scholarships.   │
│                                                     │
│ [See Sample First]  [Start Browsing →]            │
└────────────────────────────────────────────────────┘
```

**"See Sample First":** Opens TU Berlin modal  
**"Start Browsing":** Closes modal, shows programs page

**Impact:** +15-20% first-session activation

---

#### 3.2 First-Time Dashboard Tooltip
**File:** `src/routes/dashboard/+page.svelte`

**If user visits dashboard before activating:**

Add tooltip arrow pointing to activation banner:
```
👆 Try this first! It only takes 1 credit and shows 
your exact scholarship matches.
```

**Dismiss:** Click "Browse Programs" or click "Got it"

**Impact:** +3-5% activation from dashboard visitors

---

#### 3.3 Exit-Intent Popup (Homepage)
**File:** `src/routes/+page.svelte`

**When mouse moves toward browser close/back button:**

```
┌────────────────────────────────────────────────────┐
│ ⚠️ Before you go...                                 │
│                                                     │
│ Did you know you get 3 free credits to try our    │
│ AI scholarship matching?                           │
│                                                     │
│ See your fit score + scholarships for any program │
│ in 30 seconds.                                     │
│                                                     │
│ [See Sample Output]  [Browse Programs Now →]       │
└────────────────────────────────────────────────────┘
```

**Impact:** +5-8% of bounce visitors convert to activation

---

#### 3.4 Email Drip Campaign
**Tool:** Customer.io (already integrated)

**Email 1: Welcome (Day 0 - Immediately after signup)**
```
Subject: Welcome! Here's how to use your 3 free credits

Hi [Name],

Thanks for joining Abroaducate! You have 3 free 
credits waiting.

Here's the quickest way to get value:

1. Browse programs: [Browse Now]
2. Click one you like
3. Click "Unlock Scholarship Strategy" (1 credit)

You'll instantly see:
• Your fit score (0-100)
• Top 5 scholarships you qualify for
• Your chances of winning each
• Application tips for your profile

Try it now (takes 30 seconds):
[Unlock Your First Strategy →]

— Sola
Founder, Abroaducate
```

**Email 2: Nudge (Day 3 - If still 3 credits)**
```
Subject: You still have 3 free credits 💰

Hi [Name],

I noticed you haven't tried the AI scholarship 
matching yet. You're missing out!

Here's what you get for just 1 credit:

✅ Personalized fit score
✅ Top 5 scholarship matches
✅ Application tips

It takes 30 seconds and helps you avoid wasting 
time on programs you won't qualify for.

[See Sample Output] [Unlock Your First Strategy →]

Still have questions? Just reply to this email.

— Sola
```

**Email 3: Last Chance (Day 7 - If still 3 credits)**
```
Subject: Last reminder: 3 free credits expiring soon ⏰

Hi [Name],

Your 3 free credits won't last forever. Use them 
before they expire!

Quick reminder of what you're missing:

• AI-powered fit scores (know your chances)
• Scholarship matches (find funding)
• Application tips (increase win rate)

The 37 students who've tried it gave it 4.8/5 stars.

Don't let your credits go to waste:
[Unlock Your First Strategy →]

— Sola

P.S. Still not sure? Reply and tell me what's 
holding you back. I read every email.
```

**Impact:** +8-12% activation from email nudges

---

### Priority 3 Timeline
- **Day 1:** Post-signup redirect + overlay modal
- **Day 2:** Dashboard tooltip for first-time visitors
- **Day 3:** Exit-intent popup on homepage
- **Day 4:** Customer.io email drip setup
- **Day 5:** Test end-to-end flow
- **Day 6:** Send Email 1 to all users with 3 credits (backfill)
- **Day 7:** Monitor results

**Expected Lift:** +15-20% activation (from 16-22% → 31-42%)

---

## 📊 Combined Impact Projection

| Change | Expected Lift | Cumulative Rate |
|--------|---------------|-----------------|
| **Baseline (Current)** | - | 6.78% |
| **Priority 2: Trust Signals** | +10-15% | 16-22% |
| **Priority 3: Onboarding** | +15-20% | 31-42% |
| **Target** | - | **15%+ ✅** |

**Conservative Estimate:** 25-30% activation  
**Optimistic Estimate:** 35-45% activation  

---

## ✅ Success Criteria

### Week 1 After Priority 2+3 (Aug 28)
- [ ] Activation rate: **20%+** (currently 6.78%)
- [ ] Daily activation: 50%+ of days have activations (currently 14%)
- [ ] Never activated: <95% (currently 99.13%)
- [ ] Feature uses: 20+ per week (currently 13 total since July 29)

### Week 2 After Priority 2+3 (Sep 4)
- [ ] Activation rate: **30%+**
- [ ] Daily activation: 80%+ of days
- [ ] Never activated: <90%
- [ ] First paying customer from new signups

---

## 🚀 Implementation Order

### Phase 1: Quick Wins (Days 1-3)
1. Homepage hero update
2. Programs listing banner
3. Post-signup overlay modal
4. Email drip setup

### Phase 2: Enhancement (Days 4-5)
5. Usage counter component
6. Strategy card enhancement
7. Dashboard tooltip
8. Exit-intent popup

### Phase 3: Monitor & Iterate (Days 6-7)
9. Test full flow with 3-5 new test accounts
10. Send backfill email to existing users
11. Monitor activation rate daily
12. Adjust messaging based on early results

---

## 📏 Measurement Plan

**Daily Query (Run every morning):**
```sql
SELECT 
  DATE(u.created_at) as date,
  COUNT(DISTINCT u.id) as signups,
  COUNT(DISTINCT ct.user_id) as activated,
  ROUND(COUNT(DISTINCT ct.user_id) * 100.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) as rate
FROM auth.users u
LEFT JOIN credit_transactions ct 
  ON ct.user_id = u.id 
  AND ct.amount < 0
  AND ct.action_type NOT LIKE 'STRIPE_%'
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(u.created_at)
ORDER BY date DESC;
```

**Target:** 20%+ activation rate within 7 days

---

## 🎯 Why This Will Work

**Current problem:**
- Users sign up → 99% never activate → leave

**After Priority 2 (Trust):**
- Users land → see social proof → trust increases → see sample → understand value → browse with intent → activate

**After Priority 3 (Onboarding):**
- Users sign up → overlay guides them → redirected to programs → browse → see enhanced card → activate
- Users who bounce → exit intent captures them → show value → activate
- Users who don't activate → emails nudge them → activate

**Combined effect:**
- Discovery: ✅ (multiple touchpoints)
- Trust: ✅ (social proof, samples, usage stats)
- Guidance: ✅ (overlay, tooltips, emails)
- Friction: ✅ Reduced (only 1 credit, sample visible)

---

## 🔥 READY TO IMPLEMENT?

This is the **last chance** to fix activation before it becomes a chronic problem. 

**Do you want me to start implementing Priority 2 first (trust signals)?**
