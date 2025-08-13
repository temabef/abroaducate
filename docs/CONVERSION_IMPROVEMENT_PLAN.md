## Conversion Improvement Plan (Step-by-Step, Phased)

### Status Snapshot (as of now)
- [x] Phase 1 — Plan types alignment
  - UI/runtime references updated to `free/professional/elite` (Navigation badges, Subscribe page, plagiarism limits). DB schema left unchanged per current prod alignment and your guidance.
- [x] Phase 2 — Limits/keys harmonized
  - Fixed `text_improvements` → `text_enhancements` usage keys; aligned free docs total to 6 in enforcement.
- [x] Phase 3 — Stripe integrity
  - Webhook upsert hardened; success/payment events tracked; preserve admin overrides. Reconciliation skipped (no paid users yet).
- [x] Phase 4 — Analytics instrumentation
  - Implemented: identify on auth with `{ plan_type, email }`, upgrade modal events (`shown/clicked/dismissed`), checkout session created, webhook `invoice_payment_*`, auth modal events (Google/email start/fail, close, mode switch), auth callback success/fail logs, university match events (`match_generated`, `match_failed`), quick profile events (`completed`, `closed`), scholarships list viewed and quick profile prompt clicks.
  - Remaining: create PostHog dashboards and funnels; optional additional events (`checkout_redirected`, `limit_warning_80pct`).
- [x] Phase 5 — One‑click upgrade from context
  - Upgrade modal creates checkout session directly; falls back to pricing on error.
- [x] Phase 6 — Value gating with soft walls
  - University Matching requires login; returns `needs_profile` when minimal profile missing; visible UI prompts for quick profile.
  - Scholarships in University Matching: backend soft-wall (titles only for free), UI blur + Upgrade CTA.
  - Scholarships page: removed random match%; added quick profile gating; honest match scoring when profile exists.
- [ ] Phase 7 — Trials/pricing copy
  - In progress. Implemented 3‑day Professional trial (one per user), pricing CTAs, webhook `trial_started`, trial treated as unlocked, and 24h trial-ending reminders.
- [x] Phase 8 — Resume flows
  - Implemented for University Matching: cache form pre-auth, auto-restore and run post-auth (`?resume=1`) with session-resolution retries.
- [x] Phase 9 — Reconciliation/support
  - Implemented admin audit and fix endpoints (`/api/admin/subscription-reconcile`). Cleaned orphaned `active/trialing` DB rows with no Stripe subscription (kept 3 protected accounts). Audit now reports zero mismatches.
- [ ] Phase 10 — Experiments/KPIs
  - Not started. Funnels/dashboards to configure after broader analytics events.

### Additional Improvements (not originally listed)
- Quick Profile system
  - Added `public.user_quick_profile` (RLS) for degree_level, field_of_study, preferred_countries, gpa_range, scholarship_priority.
  - Implemented `QuickProfileModal` and client+DB persistence; University Matching and Scholarships integrate with quick profile prompts.
- OAuth robustness
  - `getBaseUrl()` now uses `window.location.origin` to avoid redirect URI mismatches across environments.
  - Auth callback forwards provider errors to `/auth/error?msg=...` for quicker diagnosis.
- University Matching UX
  - Fixed invalid deadline rendering; improved anonymous flow to show in-app login modal.
  - Added session-resolution fallback (`supabase.auth.getSession()`) to avoid race conditions.
- A11y
  - Fixed label associations in University Matcher form.
- Scholarship suggestions tightening
  - Matching API returns up to 3 real scholarships from `public.scholarships` only (university → country → global), with level/GPA filters; removed fabricated fallbacks.

### What’s left (high-priority next)
- Phase 4 wrap-up:
  - Build PostHog dashboards/funnels and verify event properties; add `checkout_redirected` and `limit_warning_80pct` if needed.

#### PostHog funnels and dashboards to create (spec)

- Upgrade funnel (7 steps)
  1) `upgrade_prompt_shown`
  2) `upgrade_modal_clicked`
  3) `checkout_session_created`
  4) `checkout_redirected`
  5) `subscription_activated` (webhook)
  6) `invoice_payment_succeeded` (webhook)
  7) `checkout_success_confirmed` (client success page)
  - Break down by: `plan`, `source`, `feature`, `limitType`, `billing_cycle`
  - Filters: exclude internal/test users, last 30 days
  - Trends panel: conversion rate and median time between steps (prompt→clicked, clicked→session, session→activated)

- Auth → Profile → Match funnel (5 steps)
  1) `auth_google_started` OR `auth_email_login_started` OR `auth_email_signup_started`
  2) auth success (proxy as page navigation to the next page or `checkout_success_confirmed` for paid; optional server log)
  3) `quick_profile_completed`
  4) `match_generated` (universities)
  5) `scholarships_list_viewed` (optional step for scholarship browsing)
  - Break down by: `source` (modal/surface), device, country
  - Trends: drop-off by step; time to complete quick profile and time to first match

- Early usage warnings
  - Insight: count of `limit_warning_80pct` by `feature` and `limitType` (daily)
  - Panel: CTR from warning to `upgrade_modal_clicked`

- Content discovery
  - Insight: `scholarships_list_viewed` daily trend and distribution by filters (add properties later as needed)

- Dashboards
  - “Upgrade Funnel” dashboard: includes the upgrade funnel, trend panels, and breakdowns by plan/source
  - “Activation & Match” dashboard: includes the auth→profile→match funnel and related trends
  - “Usage Warnings” dashboard: warnings and follow-through to upgrade

- Cohorts/Segments
  - New users who saw `upgrade_prompt_shown` but not `checkout_session_created` in 7 days
  - Users who completed `quick_profile_completed` but have not triggered `match_generated`
  - Users with `invoice_payment_failed`

- QA checklist
  - Verify properties exist on each event: user_id/plan_type (when available), feature, limitType, source, billing_cycle, counts/durations
  - Confirm SPA navigations produce `page_viewed` and session recordings contain cross-page navigation
  - Sampling: ensure session recording sampling set appropriately during QA (e.g., 100%), then reduce
- Phase 7: Trials/copy
  - Add optional 3‑day Professional trial with Stripe; pricing emphasis and banner.
- Phase 8 (extend):
  - Consider resume flows for other gated actions (exports, editors) if needed.
- Phase 10: Experiments/KPIs
  - Configure A/B tests (modal → checkout vs pricing; soft-wall variants), define KPIs, build PostHog dashboards.


### Goals
- **Primary**: Convert first paid users by tightening value gating, fixing plan inconsistencies, and reducing checkout friction.
- **Secondary**: Establish reliable analytics for the upgrade funnel and create a repeatable experimentation loop.

### Guiding Principles
- **Consistency over speed**: One source of truth for plan type and limits across DB, API, and UI.
- **Value, then gate**: Let users experience clear value, then present a contextual, low-friction upgrade.
- **Measure everything**: Instrument the full funnel to guide iterations.
- **Reversible**: Each change ships behind a safe plan with rollbacks.

---

## Phase 0 — Baseline and Safeguards 
 - **What**: Snapshot metrics, add feature flags where helpful.
 - **Why**: Know current funnel, avoid regressions during rollout.
 - **Tasks**:
   - **Baseline metrics**: WAU/MAU, signup→first active event, upgrade clicks, checkout starts, checkout success, time-to-upgrade, feature usage leading to upgrade moments.
   - **Feature flags** (optional) for: new upgrade flow, soft walls, plan gating changes.
   - **Backups**: DB schema backup, export `user_subscriptions`, `plan_limits`, `ai_usage_log`.
 - **Acceptance**: Metrics dashboard saved in PostHog or internal doc; backups captured.

---

## Phase 1 — Unify Plan Types Across the System
 - **Problem**: DB uses `free|basic|pro`; app/Stripe uses `free|professional|elite`.
 - **Outcome**: All systems use `free|professional|elite` only.
 - **Files/Areas**:
   - DB: `database_migrations/add_subscription_system.sql`, `database_scripts/comprehensive_user_registration_fix.sql`, `database_scripts/update_production_plan_limits.sql` (any script seeding or checking plan types)
   - Frontend: `src/lib/stripe.ts` (source of truth for plan names and limits), `src/lib/components/Navigation.svelte` plan hierarchy
 - **Tasks**:
   - Update DB CHECK constraints and seeded `plan_limits` rows to `free|professional|elite`.
   - Migrate existing rows: `basic→professional`, `pro→elite` (idempotent script).
   - Remove or migrate any `user_profiles.subscription_tier` usages to rely on `user_subscriptions`.
 - **Acceptance**:
   - Creating/updating subscriptions only allows `free|professional|elite`.
   - App shows correct plan badges and navigation gating.

---

## Phase 2 — Harmonize Usage Limits and Keys
 - **Problem**: Key mismatches (e.g., `text_improvements` vs `text_enhancements`), and free limits inconsistent between pricing/UI and enforcement.
 - **Outcome**: One map of canonical usage keys and numbers used by all APIs; pricing text and enforcement match exactly.
 - **Files/Areas**:
   - `src/lib/comprehensive-usage-limits.ts` (authoritative enforcement + aliases)
   - `src/lib/stripe.ts` (plan copy and limits)
   - API endpoints using checks: `src/routes/api/*` (generate, edit, ai-features, visa-interview, university-matching, cold-email)
 - **Tasks**:
   - Decide final free/pro/elite monthly limits; update both files to match.
   - Add aliases in the limits file (e.g., map `text_improvements`→`text_enhancements`).
   - Ensure each endpoint uses canonical keys found in the map.
 - **Acceptance**:
   - Calling any endpoint with a known feature increments/blocks consistently.
   - Pricing page numbers match actual enforcement.

---

## Phase 3 — Stripe Webhook and Subscription Integrity
 - **Problem**: Potentially writing wrong `plan_type` or falling back to `free`.
 - **Outcome**: Paid users reliably become `active` in `user_subscriptions` with the correct plan.
 - **Files/Areas**:
   - `src/routes/api/stripe/create-checkout/+server.ts`
   - `src/routes/api/stripe/webhook/+server.ts`
   - `src/routes/subscription/success/+page.svelte`
 - **Tasks**:
   - Ensure checkout metadata `plan_type ∈ {professional, elite}`.
   - In webhook, upsert `user_subscriptions` with `plan_type` from metadata (honor any admin override logic), `status='active'`.
   - Add robust logging and handle Stripe subscription states (`trialing`, `active`, `canceled`).
 - **Acceptance**:
   - Happy path e2e: start checkout → webhook → `user_subscriptions` row active with correct plan.
   - Error paths logged with enough detail to debug quickly.

---

## Phase 4 — Analytics Instrumentation (Full Funnel)
 - **Problem**: Users not identified; upgrade funnel events not tracked consistently.
 - **Outcome**: We can attribute behavior and see drop-offs from limit-hit → modal → checkout → success.
 - **Files/Areas**:
   - `src/routes/+layout.svelte` (identify user on auth state)
   - `src/lib/services/upgradeService.ts`, `src/lib/components/GlobalUpgradeHandler.svelte` (modal/toast events)
   - Stripe endpoints (server-side events)
 - **Tasks**:
   - On session presence: `analytics.identify(userId, { plan_type, email })`.
   - Track events: `upgrade_prompt_shown/clicked/dismissed`, `checkout_session_created`, `checkout_redirected`, `subscription_activated`, `limit_warning_80pct`.
   - Ensure properties include `featureType`, `plan`, `billing_cycle`, `source`.
 - **Acceptance**:
   - Events visible in PostHog with correct properties; funnels and dashboards created.

---

## Phase 5 — Upgrade UX: One‑Click from Context
 - **Problem**: Users sent to generic `/pricing`, adding friction.
 - **Outcome**: High‑intent users go straight to checkout from the upgrade modal with preselected plan.
 - **Files/Areas**:
   - `src/lib/services/upgradeService.ts` (on upgrade click)
   - `src/routes/pricing/+page.svelte` (keep for research/low‑intent users)
 - **Tasks**:
   - From `handleUpgradeClick`, call `/api/stripe/create-checkout` with plan and source metadata; redirect to Stripe.
   - Pass context (feature, plan suggestion) in `metadata`.
 - **Acceptance**:
   - From hitting a limit, users can start checkout in 1 click (no extra navigation steps).

---

## Phase 6 — Value Gating with Soft Walls
 - **Problem**: Free users get too much unblocked value before hitting a clear pay moment.
 - **Outcome**: Users see value, but beyond a small quota content is partially locked with clear CTAs.
 - **Files/Areas**:
   - University matching UI and API (`src/routes/api/university-matching/+server.ts` and rendering components)
   - Scholarship details reveal logic (rendering components)
 - **Tasks**:
   - Cap free to a small number of results (e.g., 10–25). Return counts for locked items; render blurred rows/cards with an Upgrade CTA.
   - For scholarships, show titles for free; lock detailed amounts/deadlines behind upgrade.
 - **Acceptance**:
   - Free sees initial value; additional items are clearly locked with a frictionless upgrade path.

---

## Phase 7 — Trials, Pricing Emphasis, and Copy
 - **Outcome**: Lower friction to experience paid value; improve pricing clarity.
 - **Files/Areas**:
   - `src/routes/pricing/+page.svelte`, `src/lib/stripe.ts`
 - **Tasks**:
   - Enable 3‑day Professional trial (Stripe `trial_period_days`), allow promotion codes (already on), default to annual toggle and show savings.
   - Align copy to emphasize “resume where you left off” and concrete benefits.
 - **Acceptance**:
   - Trial flow available; pricing shows clear value and savings.

---

## Phase 8 — Post‑Upgrade “Resume” Flows
 - **Outcome**: After payment, users are deep‑linked back to the blocked action and it auto‑resumes.
 - **Files/Areas**:
   - `src/routes/subscription/success/+page.svelte`
   - Upgrade metadata (webhook/session success)
 - **Tasks**:
   - Store `source` and `featureType` in checkout metadata; on success, navigate back and retry the action automatically where safe.
 - **Acceptance**:
   - User confirms payment → returns to the exact feature and completes the previously blocked action.

---

## Phase 9 — Data Reconciliation and Support
 - **Outcome**: No paid user remains on free due to legacy mismatches.
 - **Tasks**:
   - Script: Find Stripe active subs lacking `user_subscriptions.active`; upsert and email users acknowledging the fix.
   - Add admin report for mismatches going forward.
 - **Acceptance**:
   - Zero mismatches; verified with a one‑time audit and a recurring check.

---

## Phase 10 — Experiments and KPIs (2‑Week Cycles)
 - **Experiments**:
   - A/B: Pricing page vs direct‑checkout from modal on limit.
   - A/B: Soft wall blurs vs hard error for university results/scholarship details/export.
   - Offer trial to high‑intent users (hit 2+ different limits in 24h).
 - **Primary KPIs**: Checkout starts/WAU, checkout success rate, time‑to‑upgrade from first limit, retention (7/30d).
 - **Secondary**: Upgrade prompt CTR, dismiss rate, distribution of features causing upgrade.
 - **Acceptance**: Experiments configured, dashboards up, decision thresholds defined.

---

## Test & Release Checklist (per phase)
- **Unit/API tests**: Limits enforcement, webhook handling, feature gating responses.
- **E2E**: Free user hits limit → sees modal → starts checkout → returns and resumes.
- **Analytics**: Events fire with correct properties.
- **Accessibility**: Modals/toasts focus, keyboard, ARIA.
- **Perf**: No significant latency from added checks.
- **Rollback**: Ability to revert DB seeds/checks; feature flag off‑switch.

---

## Rollback Plan
- Revert plan type CHECK change and seed rows (keep migration scripts ready).
- Disable new upgrade path via feature flag and fall back to `/pricing`.
- Turn off soft walls and restore previous results counts.
- Revert analytics event binding if causing issues.

---

## Responsibilities & Order of Work
1) Schema & Plan Unification (Phase 1)
2) Limits Harmonization (Phase 2)
3) Stripe Integrity (Phase 3)
4) Analytics (Phase 4)
5) One‑Click Upgrade (Phase 5)
6) Soft Walls (Phase 6)
7) Trials & Pricing Copy (Phase 7)
8) Resume Flows (Phase 8)
9) Reconciliation (Phase 9)
10) Experiments (Phase 10)

Each phase should close with: code review, test run, small canary deploy, metrics check.

---

## Appendix A — Canonical Plan & Limits (to align everywhere)
- **Plan types**: `free`, `professional`, `elite`.
- **Storage of plan**: `user_subscriptions` is the single source of truth.
- **Usage keys**: Use canonical keys from `src/lib/comprehensive-usage-limits.ts`. Maintain aliases for legacy keys (e.g., `text_improvements` → `text_enhancements`).
- **Free value**: Keep small, meaningful previews; block deeper value with clear CTAs.

## Appendix B — File Map (touchpoints)
- Database: `database_migrations/add_subscription_system.sql`, `database_scripts/*plan*`, `supabase/migrations/*ai_usage_log*`
- Core limits: `src/lib/comprehensive-usage-limits.ts`
- Plans & copy: `src/lib/stripe.ts`, `src/routes/pricing/+page.svelte`
- Stripe: `src/routes/api/stripe/create-checkout/+server.ts`, `src/routes/api/stripe/webhook/+server.ts`, `src/routes/subscription/success/+page.svelte`
- Upgrade UI: `src/lib/services/upgradeService.ts`, `src/lib/components/GlobalUpgradeHandler.svelte`
- Analytics: `src/lib/utils/posthog.ts`, event calls in the files above, `src/routes/+layout.svelte`
- High‑value endpoints: `src/routes/api/generate-sop/+server.ts`, `.../edit-text/+server.ts`, `.../ai-features/+server.ts`, `.../visa-interview/+server.ts`, `.../generate-cold-email/+server.ts`, `.../university-matching/+server.ts`

---

## Next Action (Start Here)
1) Phase 1: Update DB plan types and seeds; migrate existing rows; deploy.
2) Phase 2: Align usage keys and limits; verify endpoints and pricing match; deploy.
3) Phase 3: Verify webhook mapping and end‑to‑end subscription activation; deploy.

Then proceed to analytics (Phase 4) and one‑click upgrade (Phase 5).


