# Abroaducate: Where We Are & What’s Next

**Purpose of this doc:** One place that ties together the redesign, the “five steps / one flow” idea, what’s done, and what to do next. Use it to align the team and prioritize work.

---

## 1. What the platform is (one sentence)

**Abroaducate is an AI-powered study-abroad platform that guides students through a single journey: get a free roadmap (diagnostic), complete profile/onboarding, then use tools (SOP, scholarships, university matching, test prep, applications) with optional premium upgrades.**

---

## 2. The “general idea” and how it’s reflected in design

The docs describe a **single, combined flow** instead of many separate entry points:

- **One front door:** Homepage with **one primary CTA** → “Get Your Free Roadmap” → `/diagnostic`.
- **One journey:** The old “five stages” (Start → Prepare → Fund → Apply → Succeed) are conceptually **folded into a simpler 3-step story** on the homepage: **Get Roadmap → Follow Plan → Unlock AI**.
- **One profile:** A **unified profile** (target country, intake, GPA, field, degree, budget, etc.) drives:
  - Scholarship and university matching
  - Onboarding
  - Dashboard widgets and recommendations
- **One place to land after auth:** Login/signup → **dashboard** (no forced onboarding; profile completion is encouraged via widgets).
- **Progressive discovery:** Anonymous users can browse scholarships/universities and use GPA converter; SOP, documents, test prep, and personalized matches require login and use the same profile.

So in design terms: **one CTA, one roadmap, one profile, one dashboard** — and tools hang off that, with clear free vs premium.

---

## 3. Where we are today (implemented)

### 3.1 Entry and positioning

- **Homepage (Phase 1 done):** Single hero CTA “Get Your Free Roadmap” → `/diagnostic`, 3-step “How it works,” trust stats, testimonials, FAQ. No competing CTAs.
- **Diagnostic:** `/diagnostic` and `/diagnostic/results` exist and work; not yet fully rebranded as “Roadmap” in copy/URL.
- **Auth:** Supabase auth; post-login redirect (e.g. to `returnUrl` or `/dashboard`); no forced onboarding; `authRedirectService` + callback handle `next`/`returnUrl` and source params (e.g. `source=diagnostic`, `action=improve_profile`).

### 3.2 Unified profile and onboarding

- **Unified profile:** `user_quick_profile` + `unifiedProfile` service: load/save, completion analysis, personalized recommendations. Used by onboarding, dashboard, plan, profile widgets, university matcher, auth redirect.
- **Onboarding:** 3-step wizard (country, GPA quick-conversion, field/degree/budget); not forced; dashboard directs users to complete profile via widgets (e.g. ProfileCompletionWidget, RoadmapChecklistWidget).

### 3.3 Core tools and data

- **Scholarships:** Browse/detail (`/scholarships`, `/scholarships/[slug]`), combined display text, optional “personalize” / QuickProfileModal, my-applications.
- **Universities:** Explorer, matching API that combines and dedupes results; country-specific integrations in place.
- **Applications:** List/detail with auth and tier limits (e.g. 12 for free); linked to SOPs and checklist.
- **AI / documents:** SOP, personal statements, cover letters, review, word optimization via a unified AI feature service and usage limits.
- **Tools page:** `/tools` exists; pricing and upgrade flows (e.g. upgradeService, GlobalUpgradeHandler) are used.

### 3.4 Technical foundation

- SvelteKit 5, Supabase (session, DB), Stripe (subscription), comprehensive usage limits, plan-gated features.
- **Bug fix applied:** `authRedirectService` now correctly imports `loadUnifiedProfile` from `unifiedProfile.js` (was used but not imported).

---

## 4. What the docs say we wanted to do (planned vs done)

| Area | Planned (from roadmap/design docs) | Status |
|------|-------------------------------------|--------|
| **Homepage** | One CTA, 3 steps, trust, no clutter | ✅ Phase 1 done |
| **Diagnostic → Roadmap** | Rebrand copy, results as “Your Plan,” “Save your results” CTA | ⏳ Phase 2 not done |
| **Dashboard** | “Mission control”: new matches, application tracker, profile completion, next actions, Tools Hub entry | 🟡 Partially (widgets exist; “new matches” / tracker summary / checklist can be deepened) |
| **Tools Hub** | Central hub with free vs premium and usage left | 🟡 Exists; can be made more central and clearer |
| **Onboarding** | 3-step wizard, discovery moment, no forced redirect | ✅ Done |
| **Unified profile** | Single model driving matching and recommendations | ✅ Done |
| **Admin** | Merge `/admin/scholarships` and `/scholarships-admin`; unified Document Studio (tabs); unified Test Prep Hub | ⏳ Not done |
| **Engagement** | Rewards/badges, email notifications, success stories, weekly digest | ⏳ Largely not done |
| **Mobile / PWA** | Phase 6–7 in roadmap | ⏳ Not done |
| **Specific TODOs** | Course editing modal, PDF generation, Stripe cancellation logic | ⏳ Not done |

---

## 5. Suggested next steps (in order)

### 5.1 Quick win / correctness

- **Auth service:** The missing `loadUnifiedProfile` import in `authRedirectService.ts` has been added so onboarding checks work correctly. Deploy and verify.

### 5.2 Phase 2: Roadmap rebrand (design + copy)

- Align diagnostic with the “one flow” story:
  - **Copy:** “Take Assessment” → “Get Your Free Roadmap”; “Diagnostic Results” → “Your Personalized Study Abroad Plan.”
  - **Results page:** Journey/progress indicator, “Save your results” CTA (account creation), optional timeline visualization.
  - **Post-roadmap:** Clear benefit of creating account (modal or section) and smooth link to auth with `returnUrl`/`next` back to plan or dashboard.

### 5.3 Dashboard & Tools Hub (retention and clarity)

- **Dashboard:** Make it the clear “mission control”:
  - “New matches this week” (count + link to filtered scholarships/universities).
  - Application tracker summary (e.g. Applied | Awaiting | Deadlines ≤14 days).
  - Profile completion % and required fields; keep existing widgets.
  - Optional “Get started” checklist with progress/badges and quick actions (e.g. “Generate SOP,” “Find scholarships,” “Convert GPA,” “See university matches”).
- **Tools Hub:** Position `/tools` as the single place for all tools: show free vs premium and usage left; central upgrade entry point.

### 5.4 Consolidation and cleanup

- **Admin:** Merge `/admin/scholarships` and `/scholarships-admin` into one panel (as in POST_LAUNCH_ROADMAP).
- **Document experience:** Move toward a unified “Document Studio” (e.g. SOP / personal statement / cover letter as tabs) if it fits the current UX.
- **Test routes:** Remove or protect test/debug routes (e.g. `/test-api`, `/test-redirect`, `/test-global-upgrades`, `/test-scholarship-deadlines`, `/upgrade-demo`) or put them behind admin.

### 5.5 Backlog (from docs)

- Course editing modal, PDF generation, Stripe cancellation logic (POST_LAUNCH_ROADMAP).
- Progress/milestones and “next actions” (e.g. progressTracker, milestones).
- International university APIs (Phase II expansion).
- Engagement: rewards, notifications, success stories, weekly digest (when capacity allows).

---

## 6. How to use this overview

- **Product/design:** Use Section 2 and 4 to keep the “one flow” idea consistent and to decide what to build next (e.g. Phase 2 rebrand vs dashboard vs admin).
- **Engineering:** Use Section 3 and 5 for what’s implemented, what’s partially done, and what to implement next; use the bug fix in 3.4 for deploy.
- **Prioritization:** Suggested order: (1) deploy auth fix, (2) Phase 2 Roadmap rebrand, (3) dashboard & Tools Hub, (4) admin consolidation and TODOs, (5) engagement and scale (notifications, PWA, etc.).

---

*Summary: The redesign “combined everything” into one idea — one CTA, one roadmap, one profile, one dashboard. That’s largely in place. The next concrete steps are Phase 2 (Roadmap rebrand), then making the dashboard and Tools Hub the clear home for “check profile, see matches, and apply,” then consolidation and backlog items.*
