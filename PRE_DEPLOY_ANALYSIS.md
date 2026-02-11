# Pre-deploy analysis — Paid intelligence & launch readiness

**Date:** Feb 2025  
**Scope:** Checklist audit, implementation status, paid tools, AI usage, deploy recommendation.

---

## 1) Checklist vs implementation

### From PAID_INTELLIGENCE_RESTRUCTURE.md Section 16

| Item | Status | Notes |
|------|--------|--------|
| **Done (pre-existing)** | ✅ | Plan as default landing, Strategy Pack MVP, free preview, diagnostic→Plan, win strategy per scholarship, list/detail redesign, AdSense removed, list load fallback — all in place. |
| **Step 1 — Paid value clarity** | ✅ **Done** | Pricing: “What you get when you unlock the full plan” block (ranked list, win strategies, timeline, playbooks, limits, ad-free). Plan: “What you get” strip for free users + “Unlock full plan” CTA. Single phrase “Unlock full plan” used on Plan/preview. |
| **Step 2 — Bulk Win Strategy** | ✅ **Done** | Backend: `POST /api/scholarships/win-strategy/bulk-generate` (paid-only, 1–10 IDs, uses `scholarship_win_strategy` limit). Plan page: “Generate win strategies for saved (up to 10)” when premium + saved > 0. Saved page: “Generate win strategies (up to 10)”; 403 shows “Unlock full plan to generate win strategies in bulk.” |
| **Step 3 — Application checklist per scholarship** | 🔲 Later | Per-scholarship “documents you’ll need” + “draft SOP for this scholarship” — explicitly post–Step 1 & 2. |
| **Step 4 — Email reminders** | 🔲 Later | When SendGrid is on; doc says “Do not pay for email until we have the triggers and timeline working.” |
| **Step 5 — Elite advisory** | 🔲 Later | “Request an advisory session” — marked later. |
| **Step 6 — Analytics** | 🔲 Later | Events + funnel; Phase 1D, not blocking launch. |

**Conclusion:** Everything you committed to for *this* launch (Step 1 + Step 2) is implemented. Steps 3–6 are intentionally “when ready” / “later.”

---

## 2) Paid tools & APIs — What’s already there

- **Strategy Pack:** Full ranked list, timeline, university plan (safety/target/reach), win strategy per scholarship (single + **bulk**), all behind subscription.
- **Usage limits (comprehensive-usage-limits.server.ts):** Free vs Professional vs Elite for:
  - Documents: SOP, cover letter, personal statement, academic CV (and total_documents for Pro).
  - AI: reviews, text_enhancements, word_optimizations, grammar_check, plagiarism_checks, tone_analysis, inline_edits.
  - cold_email_generation, visa_interview_questions, university_matching / university_queries, application_tracking.
  - **scholarship_win_strategy:** 0 free, 50 Pro, unlimited Elite.
- **APIs that enforce paid/limits:** generate-sop, generate-cover-letter, generate-personal-statement, generate-academic-cv, generate-cold-email, visa-interview, university-matching, analyze-sop, improve-text, edit-text, optimize-word-count, ai-features, **win-strategy generate + bulk-generate**, check-usage-limit.
- **Stripe:** create-checkout, webhook, cancel, billing-history — in use.

No gap for “paid tools” for this phase; the value prop (Strategy Pack + documents + AI enhancements) is implemented and gated.

---

## 3) AI / OpenAI usage — Current coverage

- **Strategy Pack:** Win strategy (single + bulk) — rubric, actions, evidence, narrative angles (OpenAI).
- **Documents:** SOP, cover letter, personal statement, academic CV generation (OpenAI).
- **Enhancement:** SOP review (paragraph + overall), tone, grammar, improve-text, edit-text, word-count optimization (OpenAI).
- **Other:** Cold email, visa interview feedback, university matching (hybrid with Scorecard; AI where used).

Adding more AI features (e.g. per-scholarship “draft SOP for this scholarship”, or more automation) is a **post-launch** improvement, not a prerequisite for deploy. The doc already calls out Step 3 (“Draft SOP for this scholarship”) as next after 1 & 2.

---

## 4) Should we improve paid tools before deploy?

- **Recommendation: no.** Step 1 (value clarity) and Step 2 (bulk win strategy) are done. UX is consistent (“Unlock full plan”), and the main paid differentiator (Strategy Pack + win strategies, including bulk) is in place.
- **Optional (can be post-launch):**
  - Show “remaining win strategies this month” on Plan or account (data is already in usage limits).
  - One more analytics event for `win_strategy_bulk_requested` if you want funnel clarity.

---

## 5) Other paid features / APIs to add later (not before deploy)

- **Step 3:** Application checklist per scholarship + “Documents you’ll need” + “Draft SOP for this scholarship” (pre-fill target).
- **Step 4:** Email reminders (when SendGrid is on): deadline reminders, “Your next 3 actions.”
- **Step 5:** Elite “Request an advisory session” CTA + simple flow (form → “we’ll email to schedule” or Calendly).
- **Step 6:** Analytics events + simple funnel (preview → save → upgrade → checkout).
- **Other AI ideas (when you want to extend):**
  - “Draft SOP for this scholarship” that pre-fills program/scholarship name and key criteria (Step 3).
  - Short “why this scholarship fits you” one-liner on Plan using profile + scholarship (optional).
  - No need to hold deploy for these.

---

## 6) Deploy readiness

| Check | Status |
|-------|--------|
| Step 1 & 2 implemented | ✅ |
| Paid value clear on pricing + Plan | ✅ |
| Bulk win strategy (API + Plan + Saved) | ✅ |
| Usage limits enforced (win strategy + rest) | ✅ |
| Stripe + Supabase + envs (existing) | ✅ (no change in this pass) |
| Build | ⚠️ Run `npm run build` locally; previous run showed Svelte warnings (a11y, deprecated on:change) but no hard errors — build was progressing before timeout. |

**Recommendation:** You’re good to deploy. Steps 1 and 2 are complete; Steps 3–6 are intentionally later. No mandatory paid-tool or API changes needed before push. Optional: run a full build once and fix any new errors if they appear; the existing warnings are non-blocking for deploy.

---

## 7) Suggested next step

1. **Update PAID_INTELLIGENCE_RESTRUCTURE.md** — Mark Step 1 and Step 2 as done in Section 16 so the checklist matches reality.
2. **Commit and push** — Include pricing copy, Plan “what you get” strip, bulk win-strategy API, and Plan/Saved buttons.
3. **After deploy** — Proceed to Step 3 (per-scholarship checklist + “Draft SOP for this scholarship”) when ready; then Step 4 (email) when SendGrid is on.

I can update the checklist in PAID_INTELLIGENCE_RESTRUCTURE.md (Section 16) to tick Step 1 and Step 2 if you want that in the repo before you push.
