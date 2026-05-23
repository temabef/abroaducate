# Platform Audit And Rethink

Date: 2026-03-26

## Purpose

This document captures the codebase audit and platform assessment for Abroaducate so it can serve as a reference point during the redesign process.

The short version is this:

- The current platform is feature-rich but structurally uneven.
- The product idea is broad and crowded, with major competitors already covering scholarships, university listings, matching, and document generation.
- The implementation reflects that breadth: many features were added, but the platform now feels overloaded, hard to maintain, and strategically diluted.
- A redesign should not start from "how do we improve every existing module?"
- A redesign should start from "what is the sharpest, most differentiated problem we want to solve?"

## Executive Summary

The codebase is no longer a small app. It has become a multi-domain platform that combines:

- AI document generation
- University matching
- Scholarship discovery
- Reminder and email automation
- Billing and subscriptions
- Admin and content tooling
- Test prep and application tracking

That breadth created momentum, but it also created fragmentation.

The main strategic issue is not only technical. It is product focus.

The platform currently tries to do too many things in a space where each individual area already has large, specialized competitors. That makes it difficult to stand out, difficult to explain clearly, and difficult to maintain technically.

The main technical issue is that the architecture has not fully caught up with the scope of the product. Some parts are well structured, but many important flows still depend on large route handlers, duplicated logic, emergency fixes, inconsistent authorization, and weak type health.

## Product-Level Assessment

### Core Product Problem

The current concept appears to be:

- help students find scholarships
- help them match with universities
- help them generate documents
- help them track applications
- help them prepare for interviews/tests

Each of those may be useful, but together they create a platform that feels too broad unless there is one strong unifying edge.

Right now, the edge is not yet sharp enough.

### Why The Current Positioning Feels Weak

- Scholarship listing is already crowded.
- University listing and matching is already crowded.
- AI document generation is already crowded.
- Generic "study abroad platform" messaging is easy to imitate.
- The platform risks becoming a bundle of useful tools rather than a sharply differentiated product.

### Strategic Conclusion

The current platform should not be treated as something that only needs cleanup.

It needs rethinking at the idea level:

- What unique user pain is most urgent?
- What can this product do better than broad competitors?
- What is the smallest credible wedge into the market?
- Which current features are actually part of that wedge, and which are distractions?

## Architecture Assessment

### What The Codebase Is

The repo is a SvelteKit application with:

- Supabase for auth and database access
- Stripe for billing
- OpenAI-powered generation/editing flows
- newsletter and reminders automation
- a large SQL and migration footprint
- many route-driven server features

This is a real product codebase, not a prototype.

### Structural Strengths

- Shared auth bootstrap exists in `src/hooks.server.ts`
- Some newer endpoints use `zod` validation
- Pricing and usage logic has centralization attempts
- The app has strong feature coverage and clear effort behind it

### Structural Weaknesses

- Too much business logic sits directly inside route handlers
- Feature boundaries are blurry
- Several files are extremely large
- Service-role database access is spread across many endpoints
- There are signs of repeated emergency patching rather than steady architectural consolidation

## Major Technical Findings

### 1. Admin Security Is A Serious Concern

Most important issue found:

- `src/routes/admin/+layout.svelte` includes a hardcoded super-admin bypass based on email

This is dangerous because:

- admin access is partly being decided on the client
- a hardcoded bypass should never remain in a production admin path
- it suggests operational workaround code became part of the product runtime

There is also an additional concern in:

- `src/routes/api/admin/add-admin-user/+server.ts`

This endpoint checks authentication, but the route itself does not clearly enforce admin authorization before calling the RPC that adds admins. If the RPC is not fully self-protecting, this becomes a privilege escalation path.

### 2. Authorization Is Inconsistent

Some routes use proper session checks.

Some use RPC-based checks.

Some use service-role access directly.

This inconsistency makes it difficult to answer basic questions with confidence:

- Which routes are safe for authenticated users?
- Which routes are admin-only?
- Which logic depends on RLS?
- Which logic bypasses RLS?

That is a sign the platform needs a stricter server authorization model.

### 3. Usage Limits Are Not Enforced Consistently

There is a centralized usage helper:

- `src/lib/comprehensive-usage-limits.server.ts`

That is good.

But enforcement is inconsistent.

For example:

- some generation routes increment usage
- not all of them check the limit before generation

This creates product and billing inconsistency. Users may access features beyond intended plan restrictions depending on which endpoint they hit.

### 4. Route Handlers Are Too Large

Large files include:

- `src/routes/api/university-matching/+server.ts`
- `src/routes/api/cron/send-reminders/+server.ts`
- several large database integration modules
- large UI components such as the budget calculator and GPA converter

This has direct consequences:

- changes become risky
- reasoning about behavior becomes difficult
- testing becomes harder
- bugs hide more easily

The reminders cron file is a clear example. It contains:

- authorization
- batching
- email eligibility rules
- digest logic
- subscription alerts
- trial alerts
- newsletter behavior
- database logging
- email template generation

That is too much responsibility in one route.

### 5. Webhook Handling Needs Hardening

In `src/routes/api/stripe/webhook/+server.ts`:

- the route can return success even when the webhook secret is not properly configured
- one Stripe event type is duplicated in the switch
- processing is intentionally forgiving in a way that may hide failures

This is risky for subscription correctness.

Billing workflows should prioritize correctness, idempotency, and explicit failure handling over convenience.

### 6. Logging Is Too Noisy And Sometimes Sensitive

Some routes log operational internals that should not be routinely logged in production, including:

- API key presence and length
- verbose debugging details
- internal subscription state

Even if full secrets are not printed, the logging culture is too loose for a platform handling auth, payments, and service-role operations.

### 7. Type Health Is Weak

Running `npm run check` surfaced many TypeScript problems.

The issues include:

- `locals.user` typing drift versus actual runtime usage
- implicit `any` values
- mismatched object shapes
- data model type mismatches in university integration files

This matters because in a codebase this large, poor type health reduces trust in refactors and increases accidental breakage.

### 8. Database And Migration Posture Is Heavy And Patch-Like

There are many SQL files and migration/fix scripts across:

- `supabase/migrations`
- `database_migrations`
- `database_scripts`

This suggests a history of repeated production fixes and iterative schema patching.

That is understandable during growth, but it creates risks:

- unclear canonical schema history
- harder onboarding
- harder environment parity
- more difficult debugging of production data behavior

## Codebase Health Snapshot

### Current State

- Large surface area
- Medium-to-high complexity
- Uneven conventions
- Mixed security posture
- Weak compile-time confidence
- Strong product effort, but weak consolidation

### Overall Technical Judgment

The platform is not beyond repair, but continuing to add features on top of it without strategic narrowing would be expensive and likely counterproductive.

This is not just a "refactor the code" situation.

It is a "simplify the product, then simplify the architecture around the product" situation.

## What The Platform Is Telling Us

The codebase reflects the product strategy.

Right now it says:

- too many bets were made at once
- multiple adjacent opportunities were pursued together
- the system became a platform before the platform thesis became sharp

This is why the platform feels flawed.

The technical messiness is not random. It is partly the natural result of an overly broad product shape.

## Implications For The Redesign

### Do Not Redesign By Porting Everything

A redesign should not mean:

- rebuild scholarships
- rebuild matching
- rebuild documents
- rebuild admin
- rebuild email
- rebuild analytics

That would preserve the same strategic problem.

### Redesign Around A Sharper Wedge

The redesign should begin with:

1. one clear user segment
2. one painful workflow
3. one differentiated promise
4. one narrow system that does that exceptionally well

Only after that should surrounding features be added back.

### Questions The New Idea Should Answer

- What exact user are we serving first?
- What urgent outcome are they trying to achieve?
- What part of the study-abroad journey is most underserved?
- What can this product do that is not just "another listing tool" or "another AI writer"?
- What is the one sentence that makes the product hard to confuse with competitors?

## Recommended Direction For The Existing Platform

If you keep this current codebase as a reference while exploring a new concept, the best approach is:

- treat it as a knowledge base, not as a sacred foundation
- preserve useful domain knowledge and reusable modules
- avoid carrying over the full feature set into the next version

### What Is Most Reusable

- auth/session bootstrap patterns
- validated API route patterns
- pricing/usage ideas
- selected database knowledge
- selected document generation flows if they align with the new concept

### What Should Probably Not Be Carried Forward As-Is

- broad platform scope
- overloaded route handlers
- client-driven admin access patterns
- temporary bypass logic
- giant mixed-responsibility modules
- patch-heavy operational workflows

## Priority Risks To Remember

These are the highest-priority issues worth remembering during redesign discussions:

1. Product scope is too broad for clear differentiation.
2. Admin security needs hardening immediately if the current platform stays live.
3. Billing and usage enforcement need consistency.
4. The reminders/email system is too centralized in a single route.
5. Large modules make iteration slow and risky.
6. Type errors indicate low refactor confidence.
7. The platform has more features than architectural discipline.

## Suggested Redesign Principles

When the new idea is ready, the next platform should aim for:

- one core workflow before many supporting workflows
- server-first authorization for privileged actions
- thin routes, thick services
- one explicit admin access model
- one explicit data access pattern
- one explicit usage and billing enforcement path
- smaller modules with clear ownership
- strict type health as a release gate

## Final Conclusion

The current platform is not worthless. It contains real work, useful systems, and domain understanding.

But as a product, it is too broad and not differentiated enough.

As a codebase, it is serviceable but structurally strained.

So the right move is not to keep polishing the current idea indefinitely.

The right move is exactly what you are doing now:

- step back
- rethink the strategy
- choose a sharper idea
- rebuild around focus instead of feature accumulation

When the new concept is ready, this document should help us decide:

- what to keep
- what to discard
- what to rebuild cleanly
- and how to avoid reproducing the same strategic and technical shape

