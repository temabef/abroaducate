## Paid Intelligence + Platform Simplification Restructure (v3 — LOCKED)

This is the **single source of truth** for the new direction:

- **No new website**
- **No deleting features**
- **Radical simplification through “front‑stage vs Tools/Advanced”**
- A single flagship product: **Paid Intelligence (Strategy Pack + Playbooks + Timeline)**

The platform should feel like a guided system:

**Plan (Strategy Pack) → Apply (Playbooks) → Do next steps (Timeline/Reminders) → Write (Documents) → Track (Applications)**

---

## 1) What We’re Building (In One Sentence)

**Abroaducate turns a student’s profile + saved targets into a ranked plan, step‑by‑step playbooks, and deadlines—then helps them execute it.**

This is the edge vs “scholarship listings” and vs generic ChatGPT.

---

## 2) Locked Phase 1 Decisions (Approved)

These are locked to avoid rebuilding twice:

### A) Default landing after login/onboarding
- **Always land on Plan (Strategy Pack)** for logged-in users.

### B) Free preview size (exact)
Free users see:
- **Top 3 scholarships** (ranked)
- **Universities: 1 Safety + 1 Target + 1 Reach**
- **Timeline: 2 items**

Everything else is visible but locked behind upgrade (preview-first paywall).

### C) Pricing structure (reduce decision paralysis)
- **One paid plan only** for now: **Strategist**
- No Professional vs Elite decision in Phase 1.
- Premium/human advisory can return later only after the new experience converts.

---

## 3) Primary Audience Focus (Phase 1)

We support all categories, but we optimize for the dominant segment:

- **Masters abroad + PhD/RA positions** (graduate mobility users)
- Undergrad supported by the same flow (profile → plan → playbooks), not separate UX.

---

## 4) North‑Star Metric (Design Target)

**Activation (North‑Star):**

> % of new signups who (1) reach the Strategy Pack preview and (2) save at least 1 item (scholarship or university).

Why: it measures real value + intent, and it drives trials and retention.

Secondary metrics:
- trial starts
- checkout conversion
- day‑7 retention (becomes important once reminders are live)

---

## 5) Design Principles (Non‑Negotiables)

### A) Front-stage vs Tools/Advanced
- **Front‑stage**: 4 primary destinations max.
- **Tools/Advanced**: everything else stays available but is not competing for attention.

### B) One guided journey
The UI should always answer “what next?” and reduce clicking.

### C) Preview-first paywalls
- Never show empty states like “Upgrade to see matches.”
- Always show partial value + lock the rest.

### D) Honest probability + confidence levels
- No “guaranteed scholarship” language.
- Use “Estimated / Unknown deadline / Needs verification” labels where data is incomplete.

---

## 6) New Information Architecture (What Users See)

### Top nav (simple)
Keep the primary navigation to these:

1) **Plan** (Strategy Pack) — default home
2) **Explore** — Scholarships + Universities (one canonical matching path)
3) **Documents** — SOP / Cover Letter / Personal Statement / Academic CV
4) **Applications** — tracking + deadlines
5) **Tools (Advanced)** — everything else

Account remains as profile/subscription/settings.

### What changes conceptually
- The “Dashboard” becomes the **Plan** (Strategy Pack).  
- Most existing links are **moved**, not removed.

---

## 7) The Flagship Surface: Strategy Pack (Paid Intelligence Artifact)

### Goal
Make the product feel like “**my plan**,” not “a toolbox.”

### Strategy Pack (MVP sections)
Keep it minimal and scannable:

1) **Top Scholarships (ranked)**
   - match % + deadline urgency
   - free preview: top 3 only
   - paid unlock: full ranked list + “why this matches you”

2) **University Plan (Safety / Target / Reach)**
   - free preview: 1 per category
   - paid unlock: deeper reasoning + more recommendations

3) **Timeline (Next Steps)**
   - show only “this week / this month” guidance
   - free preview: 2 items
   - paid unlock: full timeline + reminders

4) **Next Best Actions**
   - profile completion gaps
   - direct actions (buttons): “Add prompt”, “Generate draft”, “Save scholarship”, etc.

### Required UX behavior
Every section has:
- a preview
- a locked remainder
- a single upgrade CTA (“Unlock full plan”)

---

## 8) “How do I apply?” = Application Playbooks (Execution Intelligence)

This is the most common post-discovery question and a powerful conversion moment.

### A) Route type classification (scales to thousands)
Every scholarship gets a route type:

1) Direct scholarship application (portal/email)
2) University admission = funding consideration
3) Graduate program funding / assistantships
4) Advertised position (RA/PhD posting)
5) Nomination-based
6) Third-party platform

### B) Playbook output (what users see)
On scholarship detail pages (and later universities), show:
- step-by-step checklist (5–10 steps)
- required docs checklist
- prompts/questions list
- timeline milestones
- actions: “Add to Plan”, “Generate answer to Prompt 1”

### C) Prompts/Questions Builder (MVP)
When prompts are unknown:
- user pastes prompts
- system structures them (prompt text, word limit, type)
- paid unlock: prompt-specific drafts and improvements

### Monetization for Playbooks
- Free: generic outline + limited checklist
- Paid: tailored steps + prompts workflow + reminders tied to plan

---

## 9) Monetization Model (Simplest Version)

### Free = Browse + trust
Free users can:
- browse scholarships and universities
- save items
- see Strategy Pack preview (top 3 + 3 unis + 2 timeline)
- generate limited documents (enough to feel value)

### Paid = Strategist (the only plan in Phase 1)
Strategist unlocks:
- full Strategy Pack (full ranking + explainability)
- full Playbooks + prompts workflow
- full timeline + reminders (email)
- export/share later (Phase 2+)

### Pay‑per‑use (later, not Phase 1)
Add after conversion is proven:
- one-time Strategy Pack unlock
- prompt answer credits
- doc optimization credits

---

## 10) What We Keep (But Hide Under Tools/Advanced)

These are valuable, but they should not compete with Plan/Explore/Documents/Applications:

- GPA converter
- academic analyzer
- test prep hub + IELTS practice routes
- visa interview practice
- budget calculator
- cold email generator
- blog/content

---

## 11) Redundancies to Merge/De‑emphasize (No Deletions Yet)

We reduce confusion by consolidating entry points:

- “Application Dashboard” vs “Application Tracker” → one **Applications**
- “Saved Scholarships” becomes a **tab inside Scholarships**
- University matching has **one canonical entry**
- “submit-*” document routes removed from primary navigation (keep only if needed internally)

---

## 12) Build Plan (Phase 1 Spec — What We Implement First)

### Phase 1A: Plan-first routing (foundation)
- Logged-in users land on **Plan (Strategy Pack)** after login/onboarding.
- Add a single, obvious “Continue” CTA everywhere back to Plan.

### Phase 1B: Strategy Pack MVP + preview-first paywall (highest ROI)
Deliverables:
- Strategy Pack page with 4 sections:
  - Top scholarships (ranked)
  - University plan (safety/target/reach)
  - Timeline (2 preview items)
  - Next actions (buttons)
- Free preview limits (locked decisions above)
- “Unlock full plan” CTA → checkout

### Phase 1C: Navigation simplification (move, don’t delete)
- Implement Plan / Explore / Documents / Applications / Tools (Advanced)
- Move non-core pages under Tools (Advanced)

### Phase 1D: Basic analytics (minimum)
Track these:
- `strategy_pack_viewed` (preview/full)
- `save_item_clicked` (scholarship/university)
- `upgrade_clicked` (source: strategy_pack)
- `checkout_started` / `checkout_completed`
- `playbook_viewed`
- `prompt_added`

---

## 13) Email/Reminders Plan (When to Turn It On)

We start with email only.

When Strategy Pack + Timeline is stable and being used:
- turn on email provider (SendGrid)
- start with:
  - weekly “Your next 3 actions” email (high value)
  - deadline reminders (later)

Do not pay for email until we have the triggers and timeline working.

---

## 14) What “Success” Looks Like

After Phase 1:
- the app feels simple on first use
- most users reach Strategy Pack
- users save at least one target
- paid CTA is contextual (“unlock your plan”), not generic (“upgrade”)

Then we add:
- full reminders
- playbooks depth
- context-aware doc optimization

---

## 15) Next Step (Start Implementation)

We start with **Phase 1A + Phase 1B**:

- Make **Plan (Strategy Pack)** the default landing
- Build Strategy Pack MVP with preview gating and a single paid plan (Strategist)

Once that exists, we simplify nav and begin moving features under Tools/Advanced.

---

## 16) Steps to Begin (Prioritized Checklist)

Use this as the working checklist. Tick items as you complete them.

### ✅ Done (already implemented)
- [x] Plan (Strategy Pack) is default landing after login/onboarding
- [x] Strategy Pack page with Top Scholarships, University plan, Timeline, Next actions
- [x] Free preview: top 3 scholarships, 1 safety/target/reach, 2 timeline items
- [x] Diagnostic → “Continue in Strategy Pack” with preview of Strategy Pack sections
- [x] Roadmap/Plan unified (Plan is the name; diagnostic seeds profile and leads to Plan)
- [x] Quick Profile / Plan setup checklist (Studee-style) on Plan page
- [x] Applications removed from global navbar; accessible as tab/link from Plan
- [x] Win Strategy (per scholarship): eligibility gate, rubric, action plan + AI-generated “how to win”
- [x] Scholarship list + detail page redesigned (full-width content, no shrink; indigo/slate styling)
- [x] Manual Google AdSense blocks removed (grid blank spaces fixed)
- [x] Scholarship list load resilient (fallback to `scholarships` table if decoded view fails)

### ✅ Step 1 — Paid value clarity (copy + UX) — DONE
- [x] **Pricing page:** List exactly what paid users get (ranked full list, win strategies, timeline, playbooks, document limits).
- [x] **Plan page:** Add a short “What you get with Strategist” strip or modal trigger so free users see benefits before upgrading.
- [x] **Upgrade CTAs:** Use one phrase everywhere, e.g. “Unlock full plan” or “Open full Strategy Pack.”

### ✅ Step 2 — Bulk Win Strategy (paid feature) — DONE
- [x] **Backend:** Admin or paid-only endpoint to “generate win strategies for my saved scholarships” (batch, e.g. up to 10).
- [x] **Plan / Saved scholarships:** Button “Generate win strategies for saved” that calls the batch endpoint (or one-by-one with progress).
- [x] **Usage limit:** Consume `scholarship_win_strategy` usage per generated strategy; show remaining in account or Plan.

### 🔲 Step 3 — Application checklist per scholarship (paid)
- [ ] **Data:** Per-scholarship “required documents” and “common prompts” (from playbook or DB).
- [ ] **UI:** On scholarship detail or in Plan, show “Documents you’ll need” and “Questions they often ask” for that scholarship.
- [ ] **Link:** “Draft SOP for this scholarship” / “Draft cover letter” that pre-fills target = this scholarship.

### 🔲 Step 4 — Email reminders (when SendGrid is on)
- [ ] **Triggers:** “Your saved scholarship X closes in 14 days” and “Your next 3 actions” (from Timeline).
- [ ] **Preference:** Let user opt in/out of reminder emails in account/settings.
- [ ] **Copy:** One weekly “Your plan this week” email with top deadlines and next actions.

### 🔲 Step 5 — Elite / human advisory (later)
- [ ] **CTA:** “Request an advisory session” (e.g. on Plan or account) for Elite tier.
- [ ] **Flow:** Form or button → “We’ll email you to schedule” (no calendar yet) or link to Calendly.

### 🔲 Step 6 — Analytics (Phase 1D)
- [ ] **Events:** `strategy_pack_viewed`, `save_item_clicked`, `upgrade_clicked`, `checkout_started` / `checkout_completed`, `playbook_viewed`, `win_strategy_generated`.
- [ ] **Dashboard or export:** Funnel from preview → save → upgrade → checkout (even in a simple spreadsheet at first).

---

**Recommended order to begin:**  
Start with **Step 1** (paid value clarity) so the offer is obvious, then **Step 2** (bulk win strategy) so paid users get a clear, high-value feature. After that, Step 3 (checklist + “draft for this scholarship”) and Step 4 (email) when you’re ready to turn on SendGrid.

